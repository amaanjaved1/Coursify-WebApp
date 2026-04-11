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

function secondsUntilMidnightUTC(): number {
  const now = new Date()
  const midnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  )
  return Math.floor((midnight.getTime() - now.getTime()) / 1000)
}

export async function POST(request: NextRequest) {
  if (!supabaseServiceKey) {
    return NextResponse.json(
      { error: "Server configuration error", reason: "unauthorized" },
      { status: 500 }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })

  const authHeader = request.headers.get("Authorization")
  const token = authHeader?.match(/^Bearer\s+(\S+)$/i)?.[1]
  if (!token) {
    return NextResponse.json({ error: "Unauthorized", reason: "unauthorized" }, { status: 401 })
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json(
      { error: "Authentication failed", reason: "unauthorized" },
      { status: 401 }
    )
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("semesters_completed")
    .eq("id", user.id)
    .single()

  const semestersCompleted = profile?.semesters_completed ?? 0
  const tierLimit = getTierLimit(semestersCompleted)
  const userKey = `qa:user:${user.id}`

  // Read both counters in parallel before deciding
  const [globalCount, userCount] = await Promise.all([
    redis.get<number>(GLOBAL_KEY),
    redis.get<number>(userKey),
  ])

  if ((globalCount ?? 0) >= GLOBAL_LIMIT) {
    return NextResponse.json(
      {
        error: "Queen's Answers is at capacity for today. Check back tomorrow.",
        reason: "capacity",
      },
      { status: 429 }
    )
  }

  if ((userCount ?? 0) >= tierLimit) {
    return NextResponse.json(
      {
        error: `You've used your ${tierLimit} daily questions. Resets within 24 hours.`,
        reason: "rate_limit",
      },
      { status: 429 }
    )
  }

  let question: string
  try {
    const body = await request.json()
    question = typeof body.question === "string" ? body.question.trim() : ""
  } catch {
    return NextResponse.json(
      { error: "Invalid request body", reason: "unauthorized" },
      { status: 400 }
    )
  }

  if (!question) {
    return NextResponse.json(
      { error: "Question is required", reason: "unauthorized" },
      { status: 400 }
    )
  }

  // TODO: Replace with Gemini 2.0 Flash call
  const delay = 1500 + Math.random() * 1000
  await new Promise((resolve) => setTimeout(resolve, delay))
  const answer =
    "The AI is almost ready — we're putting it through its paces before course selection. For now, head over to the course explorer and upload your grade distros to get a head start!"

  // Increment counters — set TTL only on first write (newCount === 1)
  const newGlobalCount = await redis.incr(GLOBAL_KEY)
  if (newGlobalCount === 1) {
    await redis.expire(GLOBAL_KEY, secondsUntilMidnightUTC())
  }

  const newUserCount = await redis.incr(userKey)
  if (newUserCount === 1) {
    await redis.expire(userKey, 86400)
  }

  return NextResponse.json({ answer, remaining: tierLimit - (newUserCount ?? 1) })
}
