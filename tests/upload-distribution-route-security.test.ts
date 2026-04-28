import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const authenticate = vi.hoisted(() => vi.fn())
const checkRateLimit = vi.hoisted(() => vi.fn())

vi.mock("server-only", () => ({}))
vi.mock("@/app/api/_lib/authenticated-supabase", () => ({
  getAuthenticatedSupabaseFromRequest: authenticate,
}))
vi.mock("@/app/api/_lib/rate-limit", () => ({ checkRateLimit }))
vi.mock("@/lib/pdf/parse-distribution", () => ({
  extractTextFromPdf: vi.fn(),
  parseCourseRows: vi.fn(),
  validateSolusFormat: vi.fn(),
}))
vi.mock("@/lib/redis", () => ({ redis: { del: vi.fn() } }))

const { POST } = await import("@/app/api/upload-distribution/route")

function formRequest(formData: FormData): NextRequest {
  return new NextRequest("http://localhost/api/upload-distribution", {
    method: "POST",
    body: formData,
  })
}

describe("upload distribution route request validation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authenticate.mockResolvedValue({
      ok: true,
      user: { id: "user-1", email: "ada@queensu.ca" },
      supabase: {},
    })
    checkRateLimit.mockResolvedValue({
      ok: true,
      limit: 5,
      remaining: 4,
      resetSeconds: 3600,
    })
  })

  it("rejects a non-file multipart file field before reading file properties", async () => {
    const formData = new FormData()
    formData.set("file", "not-a-file")

    const response = await POST(formRequest(formData))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.errors).toEqual(["Invalid request. Expected a file upload."])
  })
})
