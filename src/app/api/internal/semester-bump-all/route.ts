import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { redis } from "@/lib/redis"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ""

function getDueTerm(): string | null {
  const now = new Date()
  const month = now.getMonth() + 1 // 1–12
  const day = now.getDate()
  const year = now.getFullYear()

  // Window 1: Feb 1 – Apr 28 → Fall of previous year
  if (month === 2 || month === 3 || (month === 4 && day <= 28)) {
    return `Fall ${year - 1}`
  }
  // Window 2: May 15 – Aug 15 → Winter of current year
  if ((month === 5 && day >= 15) || month === 6 || month === 7 || (month === 8 && day <= 15)) {
    return `Winter ${year}`
  }
  return null // free period
}

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || !supabaseServiceKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }

  const authHeader = request.headers.get("Authorization")
  const token = authHeader?.match(/^Bearer\s+(\S+)$/i)?.[1]
  if (!token || token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const due_term = getDueTerm()
  if (!due_term) {
    return NextResponse.json({ skipped: true, reason: "Outside seasonal window" })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })

  // Fetch all eligible users (onboarded, not yet at max)
  const { data: users, error: fetchError } = await supabase
    .from("user_profiles")
    .select("id, semesters_completed")
    .eq("onboarding_completed", true)
    .lt("semesters_completed", 8)

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!users?.length) {
    return NextResponse.json({ bumped_count: 0, due_term })
  }

  // Build upsert payload with incremented values
  const now = new Date().toISOString()
  const updates = users.map((u) => ({
    id: u.id,
    semesters_completed: (u.semesters_completed ?? 0) + 1,
    updated_at: now,
  }))

  const { error: upsertError } = await supabase
    .from("user_profiles")
    .upsert(updates, { onConflict: "id" })

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  // Bust all cached access statuses so users see updated limits immediately
  await redis.delPattern("access_status:*")

  return NextResponse.json({ bumped_count: updates.length, due_term })
}
