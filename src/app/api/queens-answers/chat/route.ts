import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSupabaseFromRequest } from "@/app/api/_lib/authenticated-supabase";
import { checkRateLimit } from "@/app/api/_lib/rate-limit";
import { QUEENS_ANSWERS_DISABLED_RESPONSE_BODY } from "@/lib/queens-answers/availability";
import { z } from "zod";

const chatQuestionSchema = z.object({
  question: z.string().trim().min(1, "Question is required").max(2000, "Question is too long (max 2000 characters)"),
}).strict();

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedSupabaseFromRequest(request);
  if (!auth.ok && auth.reason === "server_configuration") {
    return NextResponse.json(
      { error: "Server configuration error", reason: "dependency_failure", dependency: "supabase" },
      { status: 500 },
    );
  }
  if (!auth.ok && auth.reason === "missing_token") {
    return NextResponse.json(
      { error: "Unauthorized", reason: "unauthorized" },
      { status: 401 },
    );
  }
  if (!auth.ok && auth.reason === "forbidden_domain") {
    return NextResponse.json(
      { error: auth.error, reason: "forbidden_domain" },
      { status: 403 },
    );
  }
  if (!auth.ok) {
    return NextResponse.json(
      { error: "Authentication failed", reason: "unauthorized" },
      { status: 401 },
    );
  }

  const { user } = auth;

  const burstLimit = await checkRateLimit({
    keyPrefix: "queens-answers:chat:user",
    identifier: user.id,
    limit: 20,
    windowSeconds: 60,
  });
  if (!burstLimit.ok && burstLimit.reason === "dependency_failure") {
    console.warn("[queens-answers/chat] burst rate-limit unavailable, failing open");
  }
  if (!burstLimit.ok && burstLimit.reason !== "dependency_failure") {
    return NextResponse.json(
      {
        error: "Too many requests. Try again shortly.",
        reason: "rate_limit",
      },
      { status: 429 },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsedBody = chatQuestionSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Invalid request body" },
      { status: 400 },
    );
  }

  return NextResponse.json(
    QUEENS_ANSWERS_DISABLED_RESPONSE_BODY,
    { status: 503 },
  );
}
