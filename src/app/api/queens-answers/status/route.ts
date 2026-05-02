import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedSupabaseFromRequest } from "@/app/api/_lib/authenticated-supabase"
import { getConfirmedAccessStatus } from "@/app/api/_lib/confirmed-access-status"
import {
  QUEENS_ANSWERS_DISABLED_DETAIL,
  QUEENS_ANSWERS_DISABLED_ERROR,
  QUEENS_ANSWERS_DISABLED_REASON,
} from "@/lib/queens-answers/availability"

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedSupabaseFromRequest(request)
  if (!auth.ok && auth.reason === "server_configuration") {
    return NextResponse.json(
      { error: "Server configuration error", reason: "dependency_failure", dependency: "supabase" },
      { status: 500 },
    )
  }
  if (!auth.ok && auth.reason === "missing_token") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!auth.ok && auth.reason === "forbidden_domain") {
    return NextResponse.json({ error: auth.error, reason: "forbidden_domain" }, { status: 403 })
  }
  if (!auth.ok) {
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
  }

  const { supabase, user } = auth
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

  return NextResponse.json(
    {
      error: QUEENS_ANSWERS_DISABLED_ERROR,
      reason: QUEENS_ANSWERS_DISABLED_REASON,
      detail: QUEENS_ANSWERS_DISABLED_DETAIL,
    },
    { status: 503 },
  )
}
