import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSupabaseFromRequest } from "@/app/api/_lib/authenticated-supabase";
import { checkRateLimit } from "@/app/api/_lib/rate-limit";
import type { UserProfile } from "@/types";
import { redis } from "@/lib/redis";
import { z } from "zod";
import {
  SEMESTER_ZERO_LOCKED_ERROR,
  getSemestersCompletedValidationError,
  isSemesterZeroLocked,
} from "@/app/api/_lib/academic-profile-validation";

const academicProfileSchema = z.object({
  semesters_completed: z.number().int().min(0).max(8),
}).strict();

async function authenticate(request: NextRequest) {
  const auth = await getAuthenticatedSupabaseFromRequest(request);
  if (!auth.ok) {
    return { user: null, error: auth.error, supabase: null, reason: auth.reason };
  }
  return { user: auth.user, error: null, supabase: auth.supabase, reason: null };
}

export async function GET(request: NextRequest) {
  const { user, error, supabase, reason } = await authenticate(request);
  if (error || !user || !supabase) {
    if (reason === "forbidden_domain") {
      return NextResponse.json({ error }, { status: 403 });
    }
    return NextResponse.json({ error }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return NextResponse.json({ profile: profile ?? null });
}

export async function POST(request: NextRequest) {
  const { user, error, supabase, reason } = await authenticate(request);
  if (error || !user || !supabase) {
    if (reason === "forbidden_domain") {
      return NextResponse.json({ error }, { status: 403 });
    }
    return NextResponse.json({ error }, { status: 401 });
  }

  const rateLimit = await checkRateLimit({
    keyPrefix: "me:academic-profile:update:user",
    identifier: user.id,
    limit: 20,
    windowSeconds: 10 * 60,
  });
  if (!rateLimit.ok && rateLimit.reason === "dependency_failure") {
    return NextResponse.json({ error: "Profile updates are temporarily unavailable." }, { status: 503 });
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

  const parsedBody = academicProfileSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const body = parsedBody.data;
  const { semesters_completed } = body;

  const validationError = getSemestersCompletedValidationError(semesters_completed);
  if (validationError) {
    return NextResponse.json(
      { error: validationError },
      { status: 400 },
    );
  }

  if (semesters_completed === 0) {
    const { data: existing } = await supabase
      .from("user_profiles")
      .select("semester_zero_locked")
      .eq("id", user.id)
      .single();

    if (isSemesterZeroLocked(semesters_completed, existing?.semester_zero_locked)) {
      return NextResponse.json(
        { error: SEMESTER_ZERO_LOCKED_ERROR },
        { status: 429 },
      );
    }
  }

  const now = new Date().toISOString();
  const { data: profile, error: upsertError } = await supabase
    .from("user_profiles")
    .upsert(
      {
        id: user.id,
        semesters_completed,
        onboarding_completed: true,
        updated_at: now,
      },
      { onConflict: "id" },
    )
    .select()
    .single();

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  await redis.del(`access_status:${user.id}`);
  return NextResponse.json({ profile: profile as UserProfile });
}
