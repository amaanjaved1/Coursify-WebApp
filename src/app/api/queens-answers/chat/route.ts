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

export async function POST(request: NextRequest) {
  if (!supabaseUrl || !supabaseServiceKey) {
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

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("semesters_completed")
    .eq("id", user.id)
    .single()

  if (profileError) {
    console.warn("[queens-answers/chat] profile fetch error:", profileError.message)
  }

  const semestersCompleted = profile?.semesters_completed ?? 0
  const tierLimit = getTierLimit(semestersCompleted)
  const userKey = `qa:user:${user.id}`

  let question: string
  try {
    const body = await request.json()
    question = typeof body.question === "string" ? body.question.trim() : ""
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    )
  }

  if (!question) {
    return NextResponse.json(
      { error: "Question is required" },
      { status: 400 }
    )
  }

  if (question.length > 2000) {
    return NextResponse.json({ error: "Question is too long (max 2000 characters)" }, { status: 400 })
  }

  const newUserCount = await redis.incr(userKey)
  if (newUserCount === 1) {
    await redis.expire(userKey, 86400)
  }

  if (newUserCount === null) {
    return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 })
  }

  if (newUserCount > tierLimit) {
    return NextResponse.json(
      {
        error: `You've used your ${tierLimit} daily questions. Resets within 24 hours.`,
        reason: "rate_limit",
      },
      { status: 429 }
    )
  }

  // TODO: Replace with Gemini 2.0 Flash call.
  // If the AI API returns a rate limit error, return:
  // { answer: "API rate limit achieved for the system. It resets daily.", remaining: Math.max(0, tierLimit - newUserCount) }
  const delay = 1500 + Math.random() * 1000
  await new Promise((resolve) => setTimeout(resolve, delay))
  const answer =
    "The AI is almost ready — we're putting it through its paces before course selection. For now, head over to the course explorer and upload your grade distros to get a head start!"

  return NextResponse.json({
    answer,
    remaining: Math.max(0, tierLimit - newUserCount),
  })
}
