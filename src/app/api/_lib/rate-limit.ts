import "server-only";

import { createHash } from "crypto";
import type { NextRequest } from "next/server";
import { getRequiredRedisClient } from "@/lib/redis";

export type RateLimitResult =
  | {
      ok: true;
      limit: number;
      remaining: number;
      resetSeconds: number;
    }
  | {
      ok: false;
      reason: "rate_limit";
      limit: number;
      resetSeconds: number;
    }
  | {
      ok: false;
      reason: "dependency_failure";
      error: string;
    };

export type RateLimitOptions = {
  keyPrefix: string;
  identifier: string;
  limit: number;
  windowSeconds: number;
};

function hashIdentifier(identifier: string): string {
  return createHash("sha256").update(identifier).digest("hex").slice(0, 32);
}

export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  return "unknown";
}

export async function checkRateLimit({
  keyPrefix,
  identifier,
  limit,
  windowSeconds,
}: RateLimitOptions): Promise<RateLimitResult> {
  try {
    const client = getRequiredRedisClient();
    const key = `rate:${keyPrefix}:${hashIdentifier(identifier)}`;
    const count = await client.incr(key);

    if (count === 1) {
      await client.expire(key, windowSeconds);
    }

    const ttl = await client.ttl(key);
    const resetSeconds = ttl > 0 ? ttl : windowSeconds;

    if (count > limit) {
      return {
        ok: false,
        reason: "rate_limit",
        limit,
        resetSeconds,
      };
    }

    return {
      ok: true,
      limit,
      remaining: Math.max(0, limit - count),
      resetSeconds,
    };
  } catch (error) {
    console.error(`[rate-limit] ${keyPrefix} failed:`, error);
    return {
      ok: false,
      reason: "dependency_failure",
      error: "Rate limiting is temporarily unavailable.",
    };
  }
}
