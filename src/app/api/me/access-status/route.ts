import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { AccessStatus } from "@/types";
import { redis } from "@/lib/redis";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "";

export async function GET(request: NextRequest) {
  if (!supabaseServiceKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
  }

  const cacheKey = `access_status:${user.id}`;
  const cached = await redis.get<AccessStatus>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  // Run both queries in parallel
  const [profileResult, uploadCountResult] = await Promise.all([
    supabase.from("user_profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("distribution_uploads")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "processed"),
  ]);

  const profile = profileResult.data;
  const upload_count = uploadCountResult.count ?? 0;

  const needs_onboarding =
    !profile || !profile.onboarding_completed || profile.semesters_completed === null || profile.semesters_completed === undefined;

  const required_uploads = needs_onboarding
    ? 0
    : Math.min(profile.semesters_completed, 6);

  const is_exempt = required_uploads === 0;

  // Deadline schedule — Summer skipped (optional semester, most students don't attend).
  // No free period: the last due term stays required until uploaded, even between deadlines.
  // Jan–Feb: Winter YYYY-1  |  Mar–May: Fall YYYY-1  |  Jun–Dec: Winter YYYY
  function getDueTerm(): string {
    const now = new Date();
    const month = now.getMonth() + 1; // 1–12
    const year = now.getFullYear();
    if (month <= 2)  return `Winter ${year - 1}`; // Jan–Feb: Winter of previous year
    if (month <= 5)  return `Fall ${year - 1}`;   // Mar–May: Fall of previous year
    return `Winter ${year}`;                       // Jun–Dec: Winter of current year
  }

  // Only non-exempt, onboarded users are subject to seasonal gates
  const due_term = is_exempt || needs_onboarding ? null : getDueTerm();

  // Check if user has already uploaded the due term (only after deadline kicks in)
  let pending_seasonal_upload = false;
  if (due_term) {
    const { data: seasonalUpload } = await supabase
      .from("distribution_uploads")
      .select("id")
      .eq("user_id", user.id)
      .eq("term", due_term)
      .eq("status", "processed")
      .maybeSingle();
    pending_seasonal_upload = !seasonalUpload;
  }

  // has_access requires both the base upload quota AND the current seasonal upload
  const has_access = needs_onboarding
    ? false
    : upload_count >= required_uploads && !pending_seasonal_upload;

  const status: AccessStatus = {
    has_access,
    is_exempt,
    upload_count,
    required_uploads,
    needs_onboarding,
    pending_seasonal_upload,
    due_term,
  };

  await redis.set(cacheKey, status, { ex: 1200 }); // 20 minutes
  return NextResponse.json(status);
}
