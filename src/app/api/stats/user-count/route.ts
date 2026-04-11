import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "";

export async function GET() {
  if (!supabaseServiceKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  const { count, error } = await supabase
    .from("user_profiles")
    .select("*", { count: "exact", head: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ count: count ?? 0 });
}
