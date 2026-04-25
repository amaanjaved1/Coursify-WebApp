import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSupabaseFromRequest } from "@/app/api/_lib/authenticated-supabase";
import { redis } from "@/lib/redis";

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedSupabaseFromRequest(request);
  if (!auth.ok && auth.reason === "server_configuration") {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }
  if (!auth.ok && auth.reason === "missing_token") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!auth.ok) {
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
  }

  const { supabase, user } = auth;
  const cacheKey = `uploads:${user.id}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return NextResponse.json({ uploads: cached });
  }

  const { data, error } = await supabase
    .from("distribution_uploads")
    .select("id, original_filename, status, term, processed_at")
    .eq("user_id", user.id)
    .order("processed_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const uploads = data ?? [];
  await redis.set(cacheKey, uploads, { ex: 300 }); // 5 minutes
  return NextResponse.json({ uploads });
}
