import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { redis } from "@/lib/redis"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ""

const GLOBAL_LIMIT = 1500
const GLOBAL_KEY = "qa:global"

function getTierLimit(semestersCompleted: number): number {
  return semestersCompleted <= 1 ? 2 : 3
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

  const [globalUsed, used] = await Promise.all([
    redis.get<number>(GLOBAL_KEY),
    redis.get<number>(userKey),
  ])

  const globalUsedNum = globalUsed ?? 0
  const usedNum = used ?? 0

  return NextResponse.json({
    dailyLimit,
    used: usedNum,
    remaining: Math.max(0, dailyLimit - usedNum),
    globalUsed: globalUsedNum,
    globalLimit: GLOBAL_LIMIT,
    globalRemaining: Math.max(0, GLOBAL_LIMIT - globalUsedNum),
  })
}
