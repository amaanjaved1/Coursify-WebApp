import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSupabaseFromRequest } from "@/app/api/_lib/authenticated-supabase";
import { getConfirmedAccessStatus } from "@/app/api/_lib/confirmed-access-status";
import { consumeQuestion } from "@/lib/queens-answers/rate-limit";

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
  let question = "";
  try {
    const body = await request.json();
    question = typeof body.question === "string" ? body.question.trim() : "";
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  if (!question) {
    return NextResponse.json(
      { error: "Question is required" },
      { status: 400 },
    );
  }

  if (question.length > 2000) {
    return NextResponse.json(
      { error: "Question is too long (max 2000 characters)" },
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
