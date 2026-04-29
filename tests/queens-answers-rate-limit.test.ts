import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Supabase mock ─────────────────────────────────────────────────────────────
const mockRpc = vi.hoisted(() => vi.fn())
const mockSelect = vi.hoisted(() => vi.fn())
const mockEq = vi.hoisted(() => vi.fn())
const mockSingle = vi.hoisted(() => vi.fn())
const mockFrom = vi.hoisted(() =>
  vi.fn(() => ({ select: mockSelect }))
)

mockSelect.mockReturnValue({ eq: mockEq })
mockEq.mockReturnValue({ eq: mockEq, single: mockSingle })

const supabase = { from: mockFrom, rpc: mockRpc } as any

// ── Module under test ─────────────────────────────────────────────────────────
import {
  tierLimitForSemesters,
  readUsage,
  consumeQuestion,
} from "@/lib/queens-answers/rate-limit"

beforeEach(() => {
  vi.clearAllMocks()
  mockSelect.mockReturnValue({ eq: mockEq })
  mockEq.mockReturnValue({ eq: mockEq, single: mockSingle })
})

// ── tierLimitForSemesters ─────────────────────────────────────────────────────
describe("tierLimitForSemesters", () => {
  it("returns 2 for null", () => expect(tierLimitForSemesters(null)).toBe(2))
  it("returns 2 for 0 semesters", () => expect(tierLimitForSemesters(0)).toBe(2))
  it("returns 2 for 1 semester", () => expect(tierLimitForSemesters(1)).toBe(2))
  it("returns 3 for 2 semesters", () => expect(tierLimitForSemesters(2)).toBe(3))
  it("returns 3 for 4 semesters", () => expect(tierLimitForSemesters(4)).toBe(3))
  it("returns 4 for 5 semesters", () => expect(tierLimitForSemesters(5)).toBe(4))
  it("returns 4 for 8 semesters", () => expect(tierLimitForSemesters(8)).toBe(4))
})

// ── readUsage ─────────────────────────────────────────────────────────────────
describe("readUsage", () => {
  // semesters=1 → tierLimitForSemesters(1) = 2 (low tier)
  it("returns used=0 when no row exists for today (PGRST116)", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: "PGRST116" } })

    const result = await readUsage(supabase, "user-1", 1)

    expect(result).toEqual({
      ok: true,
      usage: { dailyLimit: 2, used: 0, remaining: 2 },
    })
  })

  // semesters=5 → tierLimitForSemesters(5) = 4 (high tier)
  it("returns the current count when a row exists", async () => {
    mockSingle.mockResolvedValue({ data: { count: 2 }, error: null })

    const result = await readUsage(supabase, "user-1", 5)

    expect(result).toEqual({
      ok: true,
      usage: { dailyLimit: 4, used: 2, remaining: 2 },
    })
  })

  // semesters=null → tierLimitForSemesters(null) = 2; count=5 → remaining clamped to 0
  it("clamps remaining to 0 when count exceeds limit", async () => {
    mockSingle.mockResolvedValue({ data: { count: 5 }, error: null })

    const result = await readUsage(supabase, "user-1", null)

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.usage.remaining).toBe(0)
  })

  it("returns dependency_failure on unexpected supabase error", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined)
    mockSingle.mockResolvedValue({ data: null, error: { code: "PGRST500", message: "db error" } })

    const result = await readUsage(supabase, "user-1", 2)

    expect(result).toEqual({
      ok: false,
      reason: "dependency_failure",
      dependency: "supabase",
      error: "Queen's Answers quota is temporarily unavailable.",
    })
    consoleError.mockRestore()
  })

  it("returns dependency_failure when .single() throws", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined)
    mockSingle.mockRejectedValue(new Error("network error"))

    const result = await readUsage(supabase, "user-1", 1)

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("dependency_failure")
    consoleError.mockRestore()
  })
})

// ── consumeQuestion ───────────────────────────────────────────────────────────
describe("consumeQuestion", () => {
  // semesters=1 → tierLimitForSemesters(1) = 2 (low tier)
  it("returns ok=true with updated usage when allowed", async () => {
    mockRpc.mockResolvedValue({
      data: { new_count: 1, allowed: true },
      error: null,
    })

    const result = await consumeQuestion(supabase, "user-1", 1)

    expect(result).toEqual({
      ok: true,
      usage: { dailyLimit: 2, used: 1, remaining: 1 },
    })
    expect(mockRpc).toHaveBeenCalledWith("qa_consume_question", {
      p_user_id: "user-1",
      p_daily_limit: 2,
    })
  })

  // semesters=1 → limit=2; RPC says not allowed at count=2
  it("returns rate_limit when RPC says not allowed", async () => {
    mockRpc.mockResolvedValue({
      data: { new_count: 2, allowed: false },
      error: null,
    })

    const result = await consumeQuestion(supabase, "user-1", 1)

    expect(result).toEqual({
      ok: false,
      reason: "rate_limit",
      usage: { dailyLimit: 2, used: 2, remaining: 0 },
    })
  })

  it("returns dependency_failure when RPC errors", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined)
    mockRpc.mockResolvedValue({ data: null, error: { message: "connection failed" } })

    const result = await consumeQuestion(supabase, "user-1", 1)

    expect(result).toEqual({
      ok: false,
      reason: "dependency_failure",
      dependency: "supabase",
      error: "Queen's Answers quota is temporarily unavailable.",
    })
    consoleError.mockRestore()
  })

  it("returns dependency_failure when RPC throws", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined)
    mockRpc.mockRejectedValue(new Error("network error"))

    const result = await consumeQuestion(supabase, "user-1", 1)

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("dependency_failure")
    consoleError.mockRestore()
  })
})
