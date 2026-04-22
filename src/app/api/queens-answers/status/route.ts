import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getConfirmedAccessStatus } from "@/app/api/_lib/confirmed-access-status"
import { readUsage } from "@/lib/queens-answers/rate-limit"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ""

export async function GET(request: NextRequest) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: "Server configuration error", reason: "dependency_failure", dependency: "supabase" },
      { status: 500 },
    )
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

  const accessResult = await getConfirmedAccessStatus(supabase, user.id)
  if (!accessResult.ok) {
    return NextResponse.json(
      {
        error: accessResult.error,
        reason: accessResult.reason,
        dependency: accessResult.dependency,
      },
      { status: 503 },
    )
  }

  if (!accessResult.status.has_access) {
    return NextResponse.json(
      {
        error: "Queen's Answers access is locked until your contribution requirements are met.",
        reason: "entitlement_required",
      },
      { status: 403 },
    )
  }

  const usageResult = await readUsage(user.id, accessResult.semestersCompleted)
  if (!usageResult.ok) {
    return NextResponse.json(
      {
        error: usageResult.error,
        reason: usageResult.reason,
        dependency: usageResult.dependency,
      },
      { status: 503 },
    )
  }

  return NextResponse.json({
    dailyLimit: usageResult.usage.dailyLimit,
    used: usageResult.usage.used,
    remaining: usageResult.usage.remaining,
  })
}
