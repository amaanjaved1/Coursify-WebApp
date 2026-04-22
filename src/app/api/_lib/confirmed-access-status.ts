import type { SupabaseClient } from "@supabase/supabase-js"
import type { AccessStatus } from "@/types"

type ConfirmedAccessStatusSuccess = {
  ok: true
  status: AccessStatus
  semestersCompleted: number | null
}

type ConfirmedAccessStatusFailure = {
  ok: false
  reason: "dependency_failure"
  dependency: "supabase"
  error: string
}

export type ConfirmedAccessStatusResult =
  | ConfirmedAccessStatusSuccess
  | ConfirmedAccessStatusFailure

function getDueTerm(): string | null {
  const now = new Date()
  const month = now.getMonth() + 1
  const day = now.getDate()
  const year = now.getFullYear()

  if (month === 2 || month === 3 || (month === 4 && day <= 28)) {
    return `Fall ${year - 1}`
  }

  if ((month === 5 && day >= 15) || month === 6 || month === 7 || (month === 8 && day <= 15)) {
    return `Winter ${year}`
  }

  return null
}

function dependencyFailure(context: string, error: unknown): ConfirmedAccessStatusFailure {
  console.error(`[access-status] ${context} failed:`, error)
  return {
    ok: false,
    reason: "dependency_failure",
    dependency: "supabase",
    error: "Unable to determine access status right now.",
  }
}

export async function getConfirmedAccessStatus(
  supabase: SupabaseClient,
  userId: string,
): Promise<ConfirmedAccessStatusResult> {
  const [profileResult, uploadCountResult] = await Promise.all([
    supabase.from("user_profiles").select("*").eq("id", userId).maybeSingle(),
    supabase
      .from("distribution_uploads")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "processed"),
  ])

  if (profileResult.error) {
    return dependencyFailure("profile lookup", profileResult.error)
  }

  if (uploadCountResult.error) {
    return dependencyFailure("upload count lookup", uploadCountResult.error)
  }

  const profile = profileResult.data
  const upload_count = uploadCountResult.count ?? 0
  const semestersCompleted = profile?.semesters_completed ?? null

  const needs_onboarding =
    !profile ||
    !profile.onboarding_completed ||
    semestersCompleted === null ||
    semestersCompleted === undefined

  const required_uploads = needs_onboarding ? 0 : Math.min(semestersCompleted ?? 0, 6)
  const is_exempt = required_uploads === 0
  const due_term = is_exempt || needs_onboarding ? null : getDueTerm()

  let pending_seasonal_upload = false
  if (due_term) {
    const seasonalUploadResult = await supabase
      .from("distribution_uploads")
      .select("id")
      .eq("user_id", userId)
      .eq("term", due_term)
      .eq("status", "processed")
      .maybeSingle()

    if (seasonalUploadResult.error) {
      return dependencyFailure("seasonal upload lookup", seasonalUploadResult.error)
    }

    pending_seasonal_upload = !seasonalUploadResult.data
  }

  return {
    ok: true,
    semestersCompleted,
    status: {
      has_access: needs_onboarding
        ? false
        : upload_count >= required_uploads && !pending_seasonal_upload,
      is_exempt,
      upload_count,
      required_uploads,
      needs_onboarding,
      pending_seasonal_upload,
      due_term,
    },
  }
}
