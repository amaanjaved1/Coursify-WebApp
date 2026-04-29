import type { SupabaseClient } from "@supabase/supabase-js"

export const QA_TIER_LIMITS = { low: 2, mid: 3, high: 4 } as const

export type QAUsage = {
  dailyLimit: number
  used: number
  remaining: number
}

export type QAConsumeResult =
  | { ok: true; usage: QAUsage }
  | { ok: false; reason: "rate_limit"; usage: QAUsage }
  | { ok: false; reason: "dependency_failure"; dependency: "supabase"; error: string }

export type QAReadUsageResult =
  | { ok: true; usage: QAUsage }
  | { ok: false; reason: "dependency_failure"; dependency: "supabase"; error: string }

export function tierLimitForSemesters(semesters: number | null | undefined): number {
  if (semesters == null || semesters <= 1) return QA_TIER_LIMITS.low
  if (semesters <= 4) return QA_TIER_LIMITS.mid
  return QA_TIER_LIMITS.high
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function dependencyFailure(error: unknown) {
  console.error("[queens-answers/rate-limit] supabase failure:", error)
  return {
    ok: false as const,
    reason: "dependency_failure" as const,
    dependency: "supabase" as const,
    error: "Queen's Answers quota is temporarily unavailable.",
  }
}

/**
 * Resolve the effective daily limit from a raw value.
 * - null/undefined  → low tier (2)
 * - any number      → clamped to [low, high] = [2, 4]
 */
function resolveLimit(raw: number | null | undefined): number {
  if (raw == null) return QA_TIER_LIMITS.low
  return Math.min(Math.max(raw, QA_TIER_LIMITS.low), QA_TIER_LIMITS.high)
}

export async function readUsage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  userId: string,
  dailyLimit: number | null | undefined,
): Promise<QAReadUsageResult> {
  try {
    const limit = resolveLimit(dailyLimit)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("qa_daily_usage")
      .select("count")
      .eq("user_id", userId)
      .eq("date", todayIso())
      .single()

    // PGRST116 = no rows found — user hasn't asked anything today
    if (error && error.code !== "PGRST116") {
      return dependencyFailure(error)
    }

    const used: number = data?.count ?? 0
    return {
      ok: true,
      usage: {
        dailyLimit: limit,
        used,
        remaining: Math.max(0, limit - used),
      },
    }
  } catch (error) {
    return dependencyFailure(error)
  }
}

export async function consumeQuestion(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  userId: string,
  dailyLimit: number | null | undefined,
): Promise<QAConsumeResult> {
  try {
    const limit = resolveLimit(dailyLimit)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("qa_consume_question", {
      p_user_id: userId,
      p_daily_limit: limit,
    })

    if (error) {
      return dependencyFailure(error)
    }

    const result = data as { new_count: number; allowed: boolean }
    const used = result.new_count

    if (!result.allowed) {
      return {
        ok: false,
        reason: "rate_limit",
        usage: { dailyLimit: limit, used, remaining: 0 },
      }
    }

    return {
      ok: true,
      usage: {
        dailyLimit: limit,
        used,
        remaining: Math.max(0, limit - used),
      },
    }
  } catch (error) {
    return dependencyFailure(error)
  }
}
