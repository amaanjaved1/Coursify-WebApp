import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
  }

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
