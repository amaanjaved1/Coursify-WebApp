import { getRequiredRedisClient } from "@/lib/redis"

export const QA_TIER_LIMITS = { low: 2, mid: 3, high: 4 } as const

export type QAUsage = {
  dailyLimit: number
  used: number
  remaining: number
}

export type QAConsumeResult =
  | { ok: true; usage: QAUsage }
  | { ok: false; reason: "rate_limit"; usage: QAUsage }
  | { ok: false; reason: "dependency_failure"; dependency: "redis"; error: string }

export type QAReadUsageResult =
  | { ok: true; usage: QAUsage }
  | { ok: false; reason: "dependency_failure"; dependency: "redis"; error: string }

export function tierLimitForSemesters(semesters: number | null | undefined): number {
  if (semesters == null || semesters <= 1) return QA_TIER_LIMITS.low
  if (semesters <= 4) return QA_TIER_LIMITS.mid
  return QA_TIER_LIMITS.high
}

function userKey(userId: string) {
  return `qa:user:${userId}`
}
const ROLLING_USER_TTL_SECONDS = 24 * 60 * 60

async function readCount(key: string): Promise<number> {
  const client = getRequiredRedisClient()
  const v = await client.get<number | string>(key)
  if (v == null) return 0
  return typeof v === "number" ? v : Number(v) || 0
}

function dependencyFailure(error: unknown) {
  console.error("[queens-answers/rate-limit] redis failure:", error)
  return {
    ok: false as const,
    reason: "dependency_failure" as const,
    dependency: "redis" as const,
    error: "Queen's Answers quota is temporarily unavailable.",
  }
}

export async function readUsage(
  userId: string,
  semesters: number | null | undefined,
): Promise<QAReadUsageResult> {
  try {
    const dailyLimit = tierLimitForSemesters(semesters)
    const used = await readCount(userKey(userId))
    return {
      ok: true,
      usage: {
        dailyLimit,
        used,
        remaining: Math.max(0, dailyLimit - used),
      },
    }
  } catch (error) {
    return dependencyFailure(error)
  }
}

/**
 * Gate + increment. Order matters:
 *   1. Check user cap → reject "rate_limit" if hit
 *   2. INCR user counter
 *   3. Set TTL on first write (when previous count was 0)
 */
export async function consumeQuestion(
  userId: string,
  semesters: number | null | undefined,
): Promise<QAConsumeResult> {
  try {
    const dailyLimit = tierLimitForSemesters(semesters)
    const uKey = userKey(userId)
    const client = getRequiredRedisClient()

    const usedBefore = await readCount(uKey)

    if (usedBefore >= dailyLimit) {
      return {
        ok: false,
        reason: "rate_limit",
        usage: {
          dailyLimit,
          used: usedBefore,
          remaining: 0,
        },
      }
    }

    const usedAfter = await client.incr(uKey)

    // First write of this user key in the rolling window → set 24h TTL.
    if (usedBefore === 0) {
      await client.expire(uKey, ROLLING_USER_TTL_SECONDS)
    }

    const used = usedAfter ?? usedBefore + 1

    return {
      ok: true,
      usage: {
        dailyLimit,
        used,
        remaining: Math.max(0, dailyLimit - used),
      },
    }
  } catch (error) {
    return dependencyFailure(error)
  }
}
