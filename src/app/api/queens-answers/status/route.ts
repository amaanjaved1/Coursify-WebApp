import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedSupabaseFromRequest } from "@/app/api/_lib/authenticated-supabase"
import { QUEENS_ANSWERS_DISABLED_RESPONSE_BODY } from "@/lib/queens-answers/availability"

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

  return NextResponse.json(
    QUEENS_ANSWERS_DISABLED_RESPONSE_BODY,
    { status: 503 },
  )
}
