import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { redis } from "@/lib/redis";
import { getConfirmedAccessStatus } from "@/app/api/_lib/confirmed-access-status";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "";

export async function GET(request: NextRequest) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: "Server configuration error", reason: "dependency_failure", dependency: "supabase" },
      { status: 500 },
    );
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
  const cached = await redis.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
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

  await redis.set(cacheKey, accessResult.status, { ex: 1200 });
  return NextResponse.json(accessResult.status);
}
