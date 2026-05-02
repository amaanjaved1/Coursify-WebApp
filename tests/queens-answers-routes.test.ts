import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const authenticate = vi.hoisted(() => vi.fn())
const checkRateLimit = vi.hoisted(() => vi.fn())
const getConfirmedAccessStatus = vi.hoisted(() => vi.fn())
const readUsage = vi.hoisted(() => vi.fn())
const consumeQuestion = vi.hoisted(() => vi.fn())

vi.mock("server-only", () => ({}))
vi.mock("@/app/api/_lib/authenticated-supabase", () => ({
  getAuthenticatedSupabaseFromRequest: authenticate,
}))
vi.mock("@/app/api/_lib/rate-limit", () => ({ checkRateLimit }))
vi.mock("@/app/api/_lib/confirmed-access-status", () => ({
  getConfirmedAccessStatus,
}))
vi.mock("@/lib/queens-answers/rate-limit", () => ({
  readUsage,
  consumeQuestion,
}))

const statusRoute = await import("@/app/api/queens-answers/status/route")
const chatRoute = await import("@/app/api/queens-answers/chat/route")

function getRequest(): NextRequest {
  return new NextRequest("http://localhost/api/queens-answers/status")
}

function chatRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/queens-answers/chat", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  })
}

describe("Queen's Answers status route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authenticate.mockResolvedValue({
      ok: true,
      user: { id: "user-1", email: "ada@queensu.ca" },
      supabase: { from: vi.fn() },
    })
    getConfirmedAccessStatus.mockResolvedValue({
      ok: true,
      status: { has_access: true },
      semestersCompleted: 4,
    })
    readUsage.mockResolvedValue({
      ok: true,
      usage: { dailyLimit: 3, used: 1, remaining: 2 },
    })
  })

  it("returns unauthorized without checking entitlement or usage", async () => {
    authenticate.mockResolvedValueOnce({ ok: false, reason: "missing_token" })

    const response = await statusRoute.GET(getRequest())
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toEqual({ error: "Unauthorized" })
    expect(getConfirmedAccessStatus).not.toHaveBeenCalled()
    expect(readUsage).not.toHaveBeenCalled()
  })

  it("denies access when contribution entitlement is locked", async () => {
    getConfirmedAccessStatus.mockResolvedValueOnce({
      ok: true,
      status: { has_access: false },
      semestersCompleted: 2,
    })

    const response = await statusRoute.GET(getRequest())
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data).toEqual({
      error: "Queen's Answers access is locked until your contribution requirements are met.",
      reason: "entitlement_required",
    })
    expect(readUsage).not.toHaveBeenCalled()
  })

  it("returns dependency failure when confirmed access status cannot be loaded", async () => {
    getConfirmedAccessStatus.mockResolvedValueOnce({
      ok: false,
      error: "Access status is temporarily unavailable.",
      reason: "dependency_failure",
      dependency: "supabase",
    })

    const response = await statusRoute.GET(getRequest())
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data).toEqual({
      error: "Access status is temporarily unavailable.",
      reason: "dependency_failure",
      dependency: "supabase",
    })
  })

  it("returns current quota usage for entitled users", async () => {
    const response = await statusRoute.GET(getRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      dailyLimit: 3,
      used: 1,
      remaining: 2,
    })
    expect(readUsage).toHaveBeenCalledWith(expect.anything(), "user-1", 4)
  })
})

describe("Queen's Answers chat route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authenticate.mockResolvedValue({
      ok: true,
      user: { id: "user-1", email: "ada@queensu.ca" },
      supabase: { from: vi.fn() },
    })
    checkRateLimit.mockResolvedValue({
      ok: true,
      limit: 20,
      remaining: 19,
      resetSeconds: 60,
    })
    getConfirmedAccessStatus.mockResolvedValue({
      ok: true,
      status: { has_access: true },
      semestersCompleted: 5,
    })
    consumeQuestion.mockResolvedValue({
      ok: true,
      usage: { dailyLimit: 4, used: 2, remaining: 2 },
    })
  })

  it("returns burst rate-limit denial before entitlement work", async () => {
    checkRateLimit.mockResolvedValueOnce({
      ok: false,
      reason: "rate_limit",
      limit: 20,
      resetSeconds: 60,
    })

    const response = await chatRoute.POST(chatRequest({ question: "Can I take CISC 124?" }))
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data).toEqual({
      error: "Too many requests. Try again shortly.",
      reason: "rate_limit",
    })
    expect(getConfirmedAccessStatus).not.toHaveBeenCalled()
    expect(consumeQuestion).not.toHaveBeenCalled()
  })

  it("denies chat when contribution entitlement is locked", async () => {
    getConfirmedAccessStatus.mockResolvedValueOnce({
      ok: true,
      status: { has_access: false },
      semestersCompleted: 2,
    })

    const response = await chatRoute.POST(chatRequest({ question: "Can I take CISC 124?" }))
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data).toEqual({
      error: "Queen's Answers access is locked until your contribution requirements are met.",
      reason: "entitlement_required",
    })
    expect(consumeQuestion).not.toHaveBeenCalled()
  })

  it("returns dependency failure when the quota helper cannot consume a question", async () => {
    consumeQuestion.mockResolvedValueOnce({
      ok: false,
      reason: "dependency_failure",
      dependency: "supabase",
      error: "Queen's Answers quota is temporarily unavailable.",
    })

    const response = await chatRoute.POST(chatRequest({ question: "Can I take CISC 124?" }))
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data).toEqual({
      error: "Queen's Answers quota is temporarily unavailable.",
      reason: "dependency_failure",
      dependency: "supabase",
    })
  })

  it("returns daily question rate-limit denial from the quota helper", async () => {
    consumeQuestion.mockResolvedValueOnce({
      ok: false,
      reason: "rate_limit",
      usage: { dailyLimit: 4, used: 4, remaining: 0 },
    })

    const response = await chatRoute.POST(chatRequest({ question: "Can I take CISC 124?" }))
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data).toEqual({
      error: "You've used your 4 daily questions. Resets within 24 hours.",
      reason: "rate_limit",
    })
  })

  it("returns the current placeholder answer and remaining quota on success", async () => {
    vi.useFakeTimers()
    try {
      const responsePromise = chatRoute.POST(chatRequest({ question: "Can I take CISC 124?" }))
      await vi.advanceTimersByTimeAsync(3000)
      const response = await responsePromise
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        answer: expect.stringContaining("Queen's Answers is still in the works"),
        remaining: 2,
      })
      expect(consumeQuestion).toHaveBeenCalledWith(expect.anything(), "user-1", 5)
    } finally {
      vi.useRealTimers()
    }
  })
})
