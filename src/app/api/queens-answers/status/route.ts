import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { redis } from "@/lib/redis"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ""

function getTierLimit(semestersCompleted: number): number {
  if (semestersCompleted <= 1) return 2
  if (semestersCompleted <= 4) return 3
  return 4
}

export async function GET(request: NextRequest) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })

  const authHeader = request.headers.get("Authorization")
  const token = authHeader?.match(/^Bearer\s+(\S+)$/i)?.[1]
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("semesters_completed")
    .eq("id", user.id)
    .single()

  if (profileError) {
    console.warn("[queens-answers/status] profile fetch error:", profileError.message)
  }

  const semestersCompleted = profile?.semesters_completed ?? 0
  const dailyLimit = getTierLimit(semestersCompleted)
  const userKey = `qa:user:${user.id}`

  const used = await redis.get<number>(userKey)
  const usedNum = used ?? 0

  return NextResponse.json({
    dailyLimit,
    used: usedNum,
    remaining: Math.max(0, dailyLimit - usedNum),
  })
}
