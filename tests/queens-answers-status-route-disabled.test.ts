import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const authenticate = vi.hoisted(() => vi.fn())
const getConfirmedAccessStatus = vi.hoisted(() => vi.fn())
const readUsage = vi.hoisted(() => vi.fn())

vi.mock("server-only", () => ({}))
vi.mock("@/app/api/_lib/authenticated-supabase", () => ({
  getAuthenticatedSupabaseFromRequest: authenticate,
}))
vi.mock("@/app/api/_lib/confirmed-access-status", () => ({
  getConfirmedAccessStatus,
}))
vi.mock("@/lib/queens-answers/rate-limit", () => ({ readUsage }))

const { GET } = await import("@/app/api/queens-answers/status/route")
const { QUEENS_ANSWERS_DISABLED_RESPONSE_BODY } = await import("@/lib/queens-answers/availability")

function request(): NextRequest {
  return new NextRequest("http://localhost/api/queens-answers/status")
}

describe("queens answers status route disabled state", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authenticate.mockResolvedValue({
      ok: true,
      user: { id: "user-1", email: "ada@queensu.ca" },
      supabase: {},
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

  it("returns explicit disabled state without reading quota", async () => {
    const response = await GET(request())
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data).toEqual(QUEENS_ANSWERS_DISABLED_RESPONSE_BODY)
    expect(getConfirmedAccessStatus).toHaveBeenCalled()
    expect(readUsage).not.toHaveBeenCalled()
  })

  it("preserves entitlement checks before disabled state", async () => {
    getConfirmedAccessStatus.mockResolvedValueOnce({
      ok: true,
      status: {
        has_access: false,
        is_exempt: false,
        upload_count: 0,
        required_uploads: 2,
        needs_onboarding: false,
        pending_seasonal_upload: false,
        due_term: null,
      },
      semestersCompleted: 2,
    })

    const response = await GET(request())
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.reason).toBe("entitlement_required")
    expect(readUsage).not.toHaveBeenCalled()
  })
})
