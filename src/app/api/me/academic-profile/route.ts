import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSupabaseFromRequest } from "@/app/api/_lib/authenticated-supabase";
import type { UserProfile } from "@/types";
import { redis } from "@/lib/redis";
import {
  SEMESTER_ZERO_LOCKED_ERROR,
  getSemestersCompletedValidationError,
  isSemesterZeroLocked,
} from "@/app/api/_lib/academic-profile-validation";

async function authenticate(request: NextRequest) {
  const auth = await getAuthenticatedSupabaseFromRequest(request);
  if (!auth.ok) {
    return { user: null, error: auth.error, supabase: null };
  }
  return { user: auth.user, error: null, supabase: auth.supabase };
}

export async function GET(request: NextRequest) {
  const { user, error, supabase } = await authenticate(request);
  if (error || !user || !supabase) {
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
  const { user, error, supabase } = await authenticate(request);
  if (error || !user || !supabase) {
    return NextResponse.json({ error }, { status: 401 });
  }

  let body: { semesters_completed: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

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
