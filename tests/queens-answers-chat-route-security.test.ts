import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const authenticate = vi.hoisted(() => vi.fn())
const checkRateLimit = vi.hoisted(() => vi.fn())
const getConfirmedAccessStatus = vi.hoisted(() => vi.fn())
const consumeQuestion = vi.hoisted(() => vi.fn())

vi.mock("server-only", () => ({}))
vi.mock("@/app/api/_lib/authenticated-supabase", () => ({
  getAuthenticatedSupabaseFromRequest: authenticate,
}))
vi.mock("@/app/api/_lib/rate-limit", () => ({ checkRateLimit }))
vi.mock("@/app/api/_lib/confirmed-access-status", () => ({
  getConfirmedAccessStatus,
}))
vi.mock("@/lib/queens-answers/rate-limit", () => ({ consumeQuestion }))

const { POST } = await import("@/app/api/queens-answers/chat/route")
const { QUEENS_ANSWERS_DISABLED_RESPONSE_BODY } = await import("@/lib/queens-answers/availability")

function request(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/queens-answers/chat", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  })
}

function rawRequest(body: string): NextRequest {
  return new NextRequest("http://localhost/api/queens-answers/chat", {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" },
  })
}

describe("queens answers chat route validation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authenticate.mockResolvedValue({
      ok: true,
      user: { id: "user-1", email: "ada@queensu.ca" },
      supabase: {},
    })
    checkRateLimit.mockResolvedValue({
      ok: true,
      limit: 20,
      remaining: 19,
      resetSeconds: 60,
    })
    getConfirmedAccessStatus.mockResolvedValue({
      ok: true,
      status: {
        has_access: true,
        is_exempt: false,
        upload_count: 2,
        required_uploads: 2,
        needs_onboarding: false,
        pending_seasonal_upload: false,
        due_term: null,
      },
      semestersCompleted: 2,
    })
  })

  it("returns a specific error for malformed JSON", async () => {
    const response = await POST(rawRequest("{"))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Invalid JSON body")
    expect(getConfirmedAccessStatus).not.toHaveBeenCalled()
    expect(consumeQuestion).not.toHaveBeenCalled()
  })

  it("returns the first schema error before access or quota work", async () => {
    const response = await POST(request({ question: "   " }))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Question is required")
    expect(getConfirmedAccessStatus).not.toHaveBeenCalled()
    expect(consumeQuestion).not.toHaveBeenCalled()
  })

  it("returns explicit disabled state without consuming quota", async () => {
    const response = await POST(request({ question: "Which course should I take?" }))
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data).toEqual(QUEENS_ANSWERS_DISABLED_RESPONSE_BODY)
    expect(checkRateLimit).toHaveBeenCalled()
    expect(getConfirmedAccessStatus).toHaveBeenCalled()
    expect(consumeQuestion).not.toHaveBeenCalled()
  })
})
