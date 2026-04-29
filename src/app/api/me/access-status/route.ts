import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSupabaseFromRequest } from "@/app/api/_lib/authenticated-supabase";
import { redis } from "@/lib/redis";
import { getConfirmedAccessStatus } from "@/app/api/_lib/confirmed-access-status";

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedSupabaseFromRequest(request);
  if (!auth.ok && auth.reason === "server_configuration") {
    return NextResponse.json(
      { error: "Server configuration error", reason: "dependency_failure", dependency: "supabase" },
      { status: 500 },
    );
  }
  if (!auth.ok && auth.reason === "missing_token") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!auth.ok && auth.reason === "forbidden_domain") {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }
  if (!auth.ok) {
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
  }

  const { supabase, user } = auth;
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

  await redis.set(cacheKey, accessResult.status, { ex: 7200 });
  return NextResponse.json(accessResult.status);
}
