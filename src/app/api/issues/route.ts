import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSupabaseFromRequest } from "@/app/api/_lib/authenticated-supabase";
import { checkRateLimit } from "@/app/api/_lib/rate-limit";
import { z } from "zod";

const GITHUB_REPO = "amaanjaved1/Coursify-WebApp";
const GITHUB_API_BASE = "https://api.github.com";

const VALID_ISSUE_TYPES = ["bug", "feature", "feedback"] as const;
type IssueType = (typeof VALID_ISSUE_TYPES)[number];

const LABEL_MAP: Record<IssueType, string> = {
  bug: "bug",
  feature: "feature",
  feedback: "feedback",
};

const TYPE_LABELS: Record<IssueType, string> = {
  bug: "Bug Report",
  feature: "Feature Request",
  feedback: "General Feedback",
};

const issueSubmissionSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  issueType: z.enum(VALID_ISSUE_TYPES),
}).strict();

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedSupabaseFromRequest(request);
  if (!auth.ok && auth.reason === "server_configuration") {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }
  if (!auth.ok && auth.reason === "forbidden_domain") {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = auth;

  const rateLimit = await checkRateLimit({
    keyPrefix: "issues:create:user",
    identifier: user.id,
    limit: 5,
    windowSeconds: 10 * 60,
  });
  if (!rateLimit.ok && rateLimit.reason === "dependency_failure") {
    return NextResponse.json({ error: "Issue reporting is temporarily unavailable" }, { status: 503 });
  }
  if (!rateLimit.ok) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsedBody = issueSubmissionSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const body = parsedBody.data;
  const { title, description, issueType } = body;

  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    return NextResponse.json(
      { error: "Issue reporting is not configured" },
      { status: 503 },
    );
  }

  const issueBody = `# ${TYPE_LABELS[issueType]}

## 📖 Description
${description}

## 🙋 Submitted By
${user.email}

---
*Submitted at: ${new Date().toISOString()}*`;

  const ghRes = await fetch(`${GITHUB_API_BASE}/repos/${GITHUB_REPO}/issues`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${githubToken}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      body: issueBody,
      labels: [LABEL_MAP[issueType]],
    }),
  });

  if (!ghRes.ok) {
    const text = await ghRes.text();
    console.error("GitHub API error:", ghRes.status, text);
    return NextResponse.json({ error: "Failed to create issue" }, { status: 502 });
  }

  const issue = (await ghRes.json()) as { html_url: string; number: number };
  return NextResponse.json({
    issueUrl: issue.html_url,
    issueNumber: issue.number,
  });
}
