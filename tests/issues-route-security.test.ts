import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const authenticate = vi.hoisted(() => vi.fn())
const checkRateLimit = vi.hoisted(() => vi.fn())

vi.mock("server-only", () => ({}))
vi.mock("@/app/api/_lib/authenticated-supabase", () => ({
  getAuthenticatedSupabaseFromRequest: authenticate,
}))
vi.mock("@/app/api/_lib/rate-limit", () => ({ checkRateLimit }))

const { POST } = await import("@/app/api/issues/route")

function request(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/issues", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  })
}

function rawRequest(body: string): NextRequest {
  return new NextRequest("http://localhost/api/issues", {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" },
  })
}

describe("issues route security behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authenticate.mockResolvedValue({
      ok: true,
      user: { id: "user-1", email: "ada@queensu.ca" },
    })
    checkRateLimit.mockResolvedValue({
      ok: true,
      limit: 5,
      remaining: 4,
      resetSeconds: 600,
    })
  })

  it("rejects unauthenticated submissions before rate limiting or parsing", async () => {
    authenticate.mockResolvedValueOnce({
      ok: false,
      reason: "missing_token",
      error: "Unauthorized",
    })

    const response = await POST(request({ title: "Bug", description: "Details", issueType: "bug" }))

    expect(response.status).toBe(401)
    expect(checkRateLimit).not.toHaveBeenCalled()
  })

  it("rejects unexpected body fields", async () => {
    const response = await POST(
      request({
        title: "Bug",
        description: "Details",
        issueType: "bug",
        userId: "attacker-controlled",
      }),
    )

    expect(response.status).toBe(400)
  })

  it("rejects malformed JSON distinctly from schema validation", async () => {
    const response = await POST(rawRequest("{"))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Invalid JSON body")
  })

  it("returns 429 when the user exceeds the submission limit", async () => {
    checkRateLimit.mockResolvedValueOnce({
      ok: false,
      reason: "rate_limit",
      limit: 5,
      resetSeconds: 300,
    })

    const response = await POST(request({ title: "Bug", description: "Details", issueType: "bug" }))

    expect(response.status).toBe(429)
  })
})
