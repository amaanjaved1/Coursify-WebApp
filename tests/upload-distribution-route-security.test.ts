import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ParsedCourseRow } from "@/types"

const authenticate = vi.hoisted(() => vi.fn())
const checkRateLimit = vi.hoisted(() => vi.fn())
const extractTextFromPdf = vi.hoisted(() => vi.fn())
const parseCourseRows = vi.hoisted(() => vi.fn())
const validateSolusFormat = vi.hoisted(() => vi.fn())
const redisDel = vi.hoisted(() => vi.fn())
const redisDelPattern = vi.hoisted(() => vi.fn())

vi.mock("server-only", () => ({}))
vi.mock("@/app/api/_lib/authenticated-supabase", () => ({
  getAuthenticatedSupabaseFromRequest: authenticate,
}))
vi.mock("@/app/api/_lib/rate-limit", () => ({ checkRateLimit }))
vi.mock("@/lib/pdf/parse-distribution", () => ({
  extractTextFromPdf,
  parseCourseRows,
  validateSolusFormat,
}))
vi.mock("@/lib/redis", () => ({ redis: { del: redisDel, delPattern: redisDelPattern } }))
vi.mock("@/lib/github/create-issue", () => ({
  createGitHubIssue: vi.fn().mockResolvedValue(undefined),
}))

const { POST } = await import("@/app/api/upload-distribution/route")

type DbResult = { data?: unknown; error: { message: string } | null }
type UploadCall = { table: string; method: string; args: unknown[] }

function formRequest(formData: FormData): NextRequest {
  return new NextRequest("http://localhost/api/upload-distribution", {
    method: "POST",
    body: formData,
  })
}

function pdfRequest(): NextRequest {
  const formData = new FormData()
  formData.set("file", new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], "grades.pdf", { type: "application/pdf" }))
  return formRequest(formData)
}

function createQuery(table: string, result: DbResult, calls: UploadCall[]) {
  const query = {
    eq: vi.fn((...args: unknown[]) => {
      calls.push({ table, method: "eq", args })
      return query
    }),
    in: vi.fn((...args: unknown[]) => {
      calls.push({ table, method: "in", args })
      return query
    }),
    maybeSingle: vi.fn(async () => result),
    then: (onFulfilled, onRejected) => Promise.resolve(result).then(onFulfilled, onRejected),
  } satisfies PromiseLike<DbResult> & Record<string, unknown>

  return query
}

function createSupabase(options?: {
  existingUpload?: DbResult
  courseLookup?: DbResult
  stubUpsert?: DbResult
  stubIdLookup?: DbResult
  existingDistributions?: DbResult
  distributionInsert?: DbResult
  uploadRecordInsert?: DbResult
  duplicateAuditInsert?: DbResult
}) {
  const calls: UploadCall[] = []
  const settings = {
    existingUpload: { data: null, error: null },
    courseLookup: { data: [{ id: "course-1", course_code: "CISC 124" }], error: null },
    stubUpsert: { data: null, error: null },
    stubIdLookup: { data: [{ id: "course-2", course_code: "MATH 121" }], error: null },
    existingDistributions: { data: [], error: null },
    distributionInsert: { error: null },
    uploadRecordInsert: { error: null },
    duplicateAuditInsert: { error: null },
    ...options,
  } satisfies Required<NonNullable<Parameters<typeof createSupabase>[0]>>

  let coursesSelectCallCount = 0

  const supabase = {
    from: vi.fn((table: string) => {
      if (table === "distribution_uploads") {
        return {
          select: vi.fn((...args: unknown[]) => {
            calls.push({ table, method: "select", args })
            return createQuery(table, settings.existingUpload, calls)
          }),
          insert: vi.fn(async (...args: unknown[]) => {
            calls.push({ table, method: "insert", args })
            const payload = args[0] as { status?: string }
            return payload.status === "already_uploaded" ? settings.duplicateAuditInsert : settings.uploadRecordInsert
          }),
        }
      }

      if (table === "courses") {
        return {
          select: vi.fn((...args: unknown[]) => {
            calls.push({ table, method: "select", args })
            coursesSelectCallCount++
            // First call: initial code lookup; second call: post-upsert stub ID fetch
            const result = coursesSelectCallCount === 1 ? settings.courseLookup : settings.stubIdLookup
            return createQuery(table, result, calls)
          }),
          upsert: vi.fn(async (...args: unknown[]) => {
            calls.push({ table, method: "upsert", args })
            return settings.stubUpsert
          }),
        }
      }

      if (table === "course_distributions") {
        return {
          select: vi.fn((...args: unknown[]) => {
            calls.push({ table, method: "select", args })
            return createQuery(table, settings.existingDistributions, calls)
          }),
          insert: vi.fn(async (...args: unknown[]) => {
            calls.push({ table, method: "insert", args })
            return settings.distributionInsert
          }),
        }
      }

      throw new Error(`Unexpected table: ${table}`)
    }),
  }

  return { supabase, calls }
}

const parsedRows: ParsedCourseRow[] = [
  {
    course_code: "CISC 124",
    description: "Introduction to Computing Science II",
    enrollment: 120,
    grade_percentages: [20, 20, 20, 10, 10, 10, 5, 5, 0, 0, 0, 0, 0],
    computed_gpa: 3.51,
    is_full_year_part_b: false,
  },
  {
    course_code: "MATH 121",
    description: "Differential and Integral Calculus",
    enrollment: 200,
    grade_percentages: [10, 20, 20, 20, 10, 10, 5, 5, 0, 0, 0, 0, 0],
    computed_gpa: 3.25,
    is_full_year_part_b: false,
  },
]

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
    extractTextFromPdf.mockResolvedValue("Course Grade Distribution PDF text")
    validateSolusFormat.mockReturnValue({ valid: true, term: "F25" })
    parseCourseRows.mockReturnValue(parsedRows)
    redisDel.mockResolvedValue(undefined)
    redisDelPattern.mockResolvedValue(undefined)
  })

  it("rejects missing authentication before upload parsing", async () => {
    authenticate.mockResolvedValueOnce({ ok: false, reason: "missing_token" })

    const response = await POST(pdfRequest())
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toEqual({ success: false, errors: ["Please sign in to upload."] })
    expect(checkRateLimit).not.toHaveBeenCalled()
    expect(extractTextFromPdf).not.toHaveBeenCalled()
  })

  it("rejects a non-file multipart file field before reading file properties", async () => {
    const formData = new FormData()
    formData.set("file", "not-a-file")

    const response = await POST(formRequest(formData))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.errors).toEqual(["Invalid request. Expected a file upload."])
  })

  it("processes a valid upload while preserving the canonical short-code term", async () => {
    const { supabase, calls } = createSupabase()
    authenticate.mockResolvedValueOnce({
      ok: true,
      user: { id: "user-1", email: "ada@queensu.ca" },
      supabase,
    })

    const response = await POST(pdfRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      success: true,
      term: "F25",
      inserted: 2,
      skipped: [],
      stubs_created: ["MATH 121"],
      duplicates: [],
      errors: [],
    })
    expect(calls).toContainEqual({ table: "courses", method: "upsert", args: [
      expect.arrayContaining([expect.objectContaining({ course_code: "MATH 121", offering_faculty: "Unknown" })]),
      expect.objectContaining({ onConflict: "course_code", ignoreDuplicates: true }),
    ]})
    expect(calls).toContainEqual({ table: "course_distributions", method: "insert", args: [expect.arrayContaining([
      expect.objectContaining({ course_id: "course-1", term: "F25" }),
      expect.objectContaining({ course_id: "course-2", term: "F25" }),
    ])] })
    expect(redisDelPattern).toHaveBeenCalledWith("courses:*")
  })

  it("returns the confirmed duplicate response and records the duplicate audit row", async () => {
    const { supabase, calls } = createSupabase({
      existingUpload: { data: { id: "upload-1" }, error: null },
    })
    authenticate.mockResolvedValueOnce({
      ok: true,
      user: { id: "user-1", email: "ada@queensu.ca" },
      supabase,
    })

    const response = await POST(pdfRequest())
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toEqual({
      success: false,
      inserted: 0,
      skipped: [],
      stubs_created: [],
      duplicates: [],
      term: "F25",
      errors: ["You have already submitted a grade distribution for F25. Each term can only be submitted once."],
      reason: "already_uploaded",
    })
    expect(calls).toContainEqual({ table: "distribution_uploads", method: "insert", args: [
      expect.objectContaining({ user_id: "user-1", term: "F25", status: "already_uploaded" }),
    ] })
    expect(parseCourseRows).not.toHaveBeenCalled()
    expect(redisDel).toHaveBeenCalledWith("uploads:user-1")
  })

  it("returns a dependency failure when the duplicate source of truth cannot be checked", async () => {
    const { supabase } = createSupabase({
      existingUpload: { data: null, error: { message: "database unavailable" } },
    })
    authenticate.mockResolvedValueOnce({
      ok: true,
      user: { id: "user-1", email: "ada@queensu.ca" },
      supabase,
    })

    const response = await POST(pdfRequest())
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data).toEqual({
      success: false,
      inserted: 0,
      skipped: [],
      stubs_created: [],
      duplicates: [],
      term: "F25",
      errors: ["We couldn't verify whether you've already uploaded this term. Please try again shortly."],
      reason: "dependency_failure",
    })
  })

  it("returns a dependency failure when course lookup is unavailable", async () => {
    const { supabase } = createSupabase({
      courseLookup: { data: null, error: { message: "lookup failed" } },
    })
    authenticate.mockResolvedValueOnce({
      ok: true,
      user: { id: "user-1", email: "ada@queensu.ca" },
      supabase,
    })

    const response = await POST(pdfRequest())
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data).toEqual({
      success: false,
      inserted: 0,
      skipped: [],
      stubs_created: [],
      duplicates: [],
      term: "F25",
      errors: ["We couldn't verify the uploaded courses right now. Please try again shortly."],
      reason: "dependency_failure",
    })
  })

  it("returns the explicit partial-failure response when distributions save but upload status cannot be recorded", async () => {
    const { supabase } = createSupabase({
      uploadRecordInsert: { error: { message: "upload audit insert failed" } },
    })
    authenticate.mockResolvedValueOnce({
      ok: true,
      user: { id: "user-1", email: "ada@queensu.ca" },
      supabase,
    })

    const response = await POST(pdfRequest())
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data).toEqual({
      success: false,
      inserted: 2,
      skipped: [],
      stubs_created: ["MATH 121"],
      duplicates: [],
      term: "F25",
      errors: [
        "We processed the distribution data, but couldn't record your upload status. Please avoid retrying and contact support.",
      ],
      reason: "partial_failure",
    })
  })

  it("creates a stub with 6 course_units for a full-year part-B course", async () => {
    const bSuffixRows: ParsedCourseRow[] = [
      {
        course_code: "MATH 121",
        description: "Differential and Integral Calculus",
        enrollment: 200,
        grade_percentages: [10, 20, 20, 20, 10, 10, 5, 5, 0, 0, 0, 0, 0],
        computed_gpa: 3.25,
        is_full_year_part_b: true,
      },
    ]
    parseCourseRows.mockReturnValueOnce(bSuffixRows)

    const { supabase, calls } = createSupabase({
      courseLookup: { data: [], error: null },
      stubIdLookup: { data: [{ id: "stub-1", course_code: "MATH 121" }], error: null },
    })
    authenticate.mockResolvedValueOnce({
      ok: true,
      user: { id: "user-1", email: "ada@queensu.ca" },
      supabase,
    })

    await POST(pdfRequest())

    expect(calls).toContainEqual({ table: "courses", method: "upsert", args: [
      [expect.objectContaining({ course_code: "MATH 121", course_units: 6 })],
      expect.objectContaining({ onConflict: "course_code", ignoreDuplicates: true }),
    ]})
  })
})
