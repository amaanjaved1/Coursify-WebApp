import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSupabaseFromRequest } from "@/app/api/_lib/authenticated-supabase";
import { getConfirmedAccessStatus } from "@/app/api/_lib/confirmed-access-status";
import { checkRateLimit } from "@/app/api/_lib/rate-limit";
import { consumeQuestion } from "@/lib/queens-answers/rate-limit";
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

  const { supabase, user } = auth;

  const burstLimit = await checkRateLimit({
    keyPrefix: "queens-answers:chat:user",
    identifier: user.id,
    limit: 20,
    windowSeconds: 60,
  });
  if (!burstLimit.ok && burstLimit.reason === "dependency_failure") {
    return NextResponse.json(
      {
        error: "Queen's Answers is temporarily unavailable.",
        reason: "dependency_failure",
        dependency: "redis",
      },
      { status: 503 },
    );
  }
  if (!burstLimit.ok) {
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

  const accessResult = await getConfirmedAccessStatus(supabase, user.id);
  if (!accessResult.ok) {
    return NextResponse.json(
      {
        error: accessResult.error,
        reason: accessResult.reason,
        dependency: accessResult.dependency,
      },
      { status: 503 },
    );
  }

  if (!accessResult.status.has_access) {
    return NextResponse.json(
      {
        error: "Queen's Answers access is locked until your contribution requirements are met.",
        reason: "entitlement_required",
      },
      { status: 403 },
    );
  }

  const consumeResult = await consumeQuestion(user.id, accessResult.semestersCompleted);
  if (!consumeResult.ok && consumeResult.reason === "dependency_failure") {
    return NextResponse.json(
      {
        error: consumeResult.error,
        reason: consumeResult.reason,
        dependency: consumeResult.dependency,
      },
      { status: 503 },
    );
  }

  if (!consumeResult.ok && consumeResult.reason === "rate_limit") {
    return NextResponse.json(
      {
        error: `You've used your ${consumeResult.usage.dailyLimit} daily questions. Resets within 24 hours.`,
        reason: "rate_limit",
      },
      { status: 429 },
    );
  }

  // TODO: Replace with Gemini 2.0 Flash call.
  // If the AI API returns a rate limit error, return:
  // { answer: "API rate limit achieved for the system. It resets daily.", remaining: Math.max(0, tierLimit - newUserCount) }
  const delay = 1500 + Math.random() * 1000;
  await new Promise((resolve) => setTimeout(resolve, delay));
  const answer =
    "Queen's Answers is still in the works — we're aiming to have it ready in time for Fall '26 course selection. In the meantime, view all our available courses and upload your grade distributions to help build the database!";

  return NextResponse.json({
    answer,
    remaining: consumeResult.usage.remaining,
  });
}
