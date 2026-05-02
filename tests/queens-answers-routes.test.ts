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
const { QUEENS_ANSWERS_DISABLED_RESPONSE_BODY } = await import("@/lib/queens-answers/availability")

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

  it("returns disabled state for entitled users without reading quota", async () => {
    const response = await statusRoute.GET(getRequest())
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data).toEqual(QUEENS_ANSWERS_DISABLED_RESPONSE_BODY)
    expect(readUsage).not.toHaveBeenCalled()
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

  it("returns disabled state without consuming quota", async () => {
    const response = await chatRoute.POST(chatRequest({ question: "Can I take CISC 124?" }))
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data).toEqual(QUEENS_ANSWERS_DISABLED_RESPONSE_BODY)
    expect(consumeQuestion).not.toHaveBeenCalled()
  })
})
