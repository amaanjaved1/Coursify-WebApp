import { redis } from "@/lib/redis"

export const QA_GLOBAL_DAILY_LIMIT = 1500
export const QA_TIER_LIMITS = { low: 2, high: 3 } as const

export type QAUsage = {
  dailyLimit: number
  used: number
  remaining: number
  globalUsed: number
  globalLimit: number
  globalRemaining: number
}

export type QAConsumeResult =
  | { ok: true; usage: QAUsage }
  | { ok: false; reason: "rate_limit" | "capacity"; usage: QAUsage }

export function tierLimitForSemesters(semesters: number | null | undefined): number {
  if (semesters == null) return QA_TIER_LIMITS.low
  return semesters >= 2 ? QA_TIER_LIMITS.high : QA_TIER_LIMITS.low
}

function userKey(userId: string) {
  return `qa:user:${userId}`
}
const GLOBAL_KEY = "qa:global"
const ROLLING_USER_TTL_SECONDS = 24 * 60 * 60

/** Seconds remaining until next midnight UTC. Always >= 1. */
export function secondsUntilMidnightUTC(now: Date = new Date()): number {
  const next = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0,
  ))
  return Math.max(1, Math.floor((next.getTime() - now.getTime()) / 1000))
}

async function readCount(key: string): Promise<number> {
  const v = await redis.get<number | string>(key)
  if (v == null) return 0
  return typeof v === "number" ? v : Number(v) || 0
}

export async function readUsage(
  userId: string,
  semesters: number | null | undefined,
): Promise<QAUsage> {
  const dailyLimit = tierLimitForSemesters(semesters)
  const [used, globalUsed] = await Promise.all([
    readCount(userKey(userId)),
    readCount(GLOBAL_KEY),
  ])
  return {
    dailyLimit,
    used,
    remaining: Math.max(0, dailyLimit - used),
    globalUsed,
    globalLimit: QA_GLOBAL_DAILY_LIMIT,
    globalRemaining: Math.max(0, QA_GLOBAL_DAILY_LIMIT - globalUsed),
  }
}

/**
 * Gate + increment. Order matters:
 *   1. Check global cap → reject "capacity" if hit
 *   2. Check user cap   → reject "rate_limit" if hit
 *   3. INCR both counters
 *   4. Set TTLs on first write of each key (when previous count was 0)
 */
export async function consumeQuestion(
  userId: string,
  semesters: number | null | undefined,
): Promise<QAConsumeResult> {
  const dailyLimit = tierLimitForSemesters(semesters)
  const uKey = userKey(userId)

  const [usedBefore, globalBefore] = await Promise.all([
    readCount(uKey),
    readCount(GLOBAL_KEY),
  ])

  if (globalBefore >= QA_GLOBAL_DAILY_LIMIT) {
    return {
      ok: false,
      reason: "capacity",
      usage: {
        dailyLimit,
        used: usedBefore,
        remaining: Math.max(0, dailyLimit - usedBefore),
        globalUsed: globalBefore,
        globalLimit: QA_GLOBAL_DAILY_LIMIT,
        globalRemaining: 0,
      },
    }
  }

  if (usedBefore >= dailyLimit) {
    return {
      ok: false,
      reason: "rate_limit",
      usage: {
        dailyLimit,
        used: usedBefore,
        remaining: 0,
        globalUsed: globalBefore,
        globalLimit: QA_GLOBAL_DAILY_LIMIT,
        globalRemaining: Math.max(0, QA_GLOBAL_DAILY_LIMIT - globalBefore),
      },
    }
  }

  const [usedAfter, globalAfter] = await Promise.all([
    redis.incr(uKey),
    redis.incr(GLOBAL_KEY),
  ])

  // First write of this user key in the rolling window → set 24h TTL.
  if (usedBefore === 0) {
    await redis.expire(uKey, ROLLING_USER_TTL_SECONDS)
  }
  // First write of the global key today → set TTL until midnight UTC.
  if (globalBefore === 0) {
    await redis.expire(GLOBAL_KEY, secondsUntilMidnightUTC())
  }

  const used = usedAfter ?? usedBefore + 1
  const globalUsed = globalAfter ?? globalBefore + 1

  return {
    ok: true,
    usage: {
      dailyLimit,
      used,
      remaining: Math.max(0, dailyLimit - used),
      globalUsed,
      globalLimit: QA_GLOBAL_DAILY_LIMIT,
      globalRemaining: Math.max(0, QA_GLOBAL_DAILY_LIMIT - globalUsed),
    },
  }
}
