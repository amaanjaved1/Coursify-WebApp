import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const incr = vi.hoisted(() => vi.fn())
const expire = vi.hoisted(() => vi.fn())
const ttl = vi.hoisted(() => vi.fn())
const getRequiredRedisClient = vi.hoisted(() => vi.fn())

vi.mock("server-only", () => ({}))
vi.mock("@/lib/redis", () => ({ getRequiredRedisClient }))

const client = { incr, expire, ttl }

function request(headers: Record<string, string>): NextRequest {
  return new NextRequest("http://localhost/api/test", { headers })
}

describe("rate-limit helper", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getRequiredRedisClient.mockReturnValue(client)
    expire.mockResolvedValue(undefined)
    ttl.mockResolvedValue(600)
  })

  it("allows requests under the limit and sets the window on the first hit", async () => {
    incr.mockResolvedValueOnce(1)
    const { checkRateLimit } = await import("@/app/api/_lib/rate-limit")

    const result = await checkRateLimit({
      keyPrefix: "test-route",
      identifier: "user-1",
      limit: 5,
      windowSeconds: 600,
    })

    expect(result).toEqual({
      ok: true,
      limit: 5,
      remaining: 4,
      resetSeconds: 600,
    })
    expect(expire).toHaveBeenCalledWith(expect.stringContaining("rate:test-route:"), 600)
  })

  it("returns a 429-style result after the limit is exceeded", async () => {
    incr.mockResolvedValueOnce(6)
    ttl.mockResolvedValueOnce(120)
    const { checkRateLimit } = await import("@/app/api/_lib/rate-limit")

    const result = await checkRateLimit({
      keyPrefix: "test-route",
      identifier: "user-1",
      limit: 5,
      windowSeconds: 600,
    })

    expect(result).toEqual({
      ok: false,
      reason: "rate_limit",
      limit: 5,
      resetSeconds: 120,
    })
    expect(expire).not.toHaveBeenCalled()
  })

  it("fails closed when Redis is unavailable", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined)
    getRequiredRedisClient.mockImplementationOnce(() => {
      throw new Error("missing redis")
    })
    const { checkRateLimit } = await import("@/app/api/_lib/rate-limit")

    const result = await checkRateLimit({
      keyPrefix: "test-route",
      identifier: "user-1",
      limit: 5,
      windowSeconds: 600,
    })

    expect(result).toEqual({
      ok: false,
      reason: "dependency_failure",
      error: "Rate limiting is temporarily unavailable.",
    })
    consoleError.mockRestore()
  })

  it("uses the first forwarded IP address", async () => {
    const { getClientIp } = await import("@/app/api/_lib/rate-limit")

    expect(getClientIp(request({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7")
  })
})
