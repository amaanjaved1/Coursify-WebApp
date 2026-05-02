import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

type DbError = { message: string }
type DbResult = { data: unknown; count?: number | null; error: DbError | null }
type QueryCall = { method: string; args: unknown[] }

const createClient = vi.hoisted(() => vi.fn())
const redisGet = vi.hoisted(() => vi.fn())
const redisSet = vi.hoisted(() => vi.fn())

vi.mock("@supabase/supabase-js", () => ({ createClient }))
vi.mock("@/lib/redis", () => ({
  redis: {
    get: redisGet,
    set: redisSet,
  },
}))

const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const originalSupabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

function setSupabaseEnv() {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.test"
  process.env.SUPABASE_SERVICE_KEY = "service-key"
}

function restoreSupabaseEnv() {
  if (originalSupabaseUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
  } else {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl
  }

  if (originalSupabaseServiceKey === undefined) {
    delete process.env.SUPABASE_SERVICE_KEY
  } else {
    process.env.SUPABASE_SERVICE_KEY = originalSupabaseServiceKey
  }
}

async function loadCoursesRoute() {
  return import("@/app/api/courses/route")
}

async function loadCourseDetailRoute() {
  return import("@/app/api/courses/[courseCode]/route")
}

function request(path: string): NextRequest {
  return new NextRequest(`http://localhost${path}`)
}

function params(courseCode: string): { params: Promise<{ courseCode: string }> } {
  return { params: Promise.resolve({ courseCode }) }
}

function createQuery(result: DbResult) {
  const calls: QueryCall[] = []
  const query = {
    or: vi.fn((...args: unknown[]) => {
      calls.push({ method: "or", args })
      return query
    }),
    in: vi.fn((...args: unknown[]) => {
      calls.push({ method: "in", args })
      return query
    }),
    gte: vi.fn((...args: unknown[]) => {
      calls.push({ method: "gte", args })
      return query
    }),
    lte: vi.fn((...args: unknown[]) => {
      calls.push({ method: "lte", args })
      return query
    }),
    gt: vi.fn((...args: unknown[]) => {
      calls.push({ method: "gt", args })
      return query
    }),
    eq: vi.fn((...args: unknown[]) => {
      calls.push({ method: "eq", args })
      return query
    }),
    order: vi.fn((...args: unknown[]) => {
      calls.push({ method: "order", args })
      return query
    }),
    range: vi.fn((...args: unknown[]) => {
      calls.push({ method: "range", args })
      return query
    }),
    single: vi.fn(async () => result),
    maybeSingle: vi.fn(async () => result),
    then: (onFulfilled, onRejected) => Promise.resolve(result).then(onFulfilled, onRejected),
  } satisfies PromiseLike<DbResult> & Record<string, unknown>

  return { query, calls }
}

function selectFrom(chains: Record<string, ReturnType<typeof createQuery>>) {
  return vi.fn((table: string) => ({
    select: vi.fn(() => {
      const chain = chains[table]
      if (!chain) throw new Error(`Unexpected table: ${table}`)
      return chain.query
    }),
  }))
}

describe("courses API route", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    setSupabaseEnv()
    redisGet.mockResolvedValue(null)
    redisSet.mockResolvedValue(undefined)
  })

  afterEach(() => {
    restoreSupabaseEnv()
  })

  it("returns a stable course list response and applies validated filters", async () => {
    const coursesRoute = await loadCoursesRoute()
    const listChain = createQuery({
      data: [
        {
          id: "course-1",
          course_code: "CISC 124",
          course_name: "Introduction to Computing Science II",
          course_description: "Programming and problem solving.",
          course_units: 3,
          offering_faculty: "Faculty of Arts and Science",
          course_level: 100,
          computed_avg_gpa: 3.7,
          computed_avg_enrollment: 180,
          has_comments: true,
        },
      ],
      count: 3,
      error: null,
    })
    createClient.mockReturnValue({ from: selectFrom({ courses_with_stats: listChain }) })

    const response = await coursesRoute.GET(
      request(
        "/api/courses?page=2&limit=1&search=CISC%20(124),&departments=Faculty%20of%20Arts%20and%20Science&levels=100&subjects=CISC&gpa_min=2&gpa_max=4&enroll_min=10&enroll_max=300&sort_by=gpa&sort_dir=asc&availability=comments",
      ),
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      courses: [
        {
          id: "course-1",
          course_code: "CISC 124",
          course_name: "Introduction to Computing Science II",
          description: "Programming and problem solving.",
          credits: 3,
          department: "Faculty of Arts and Science",
          distributions: [],
          averageGPA: 3.7,
          totalEnrollment: 180,
          hasComments: true,
          dataAvailability: "data",
        },
      ],
      total: 3,
      page: 2,
      totalPages: 3,
    })
    expect(listChain.calls).toContainEqual({
      method: "or",
      args: ["course_code.ilike.%CISC 124%,course_name.ilike.%CISC 124%"],
    })
    expect(listChain.calls).toContainEqual({
      method: "in",
      args: ["course_level", [100]],
    })
    expect(listChain.calls).toContainEqual({
      method: "range",
      args: [1, 1],
    })
  })

  it("rejects malformed course list query parameters before creating a Supabase client", async () => {
    const coursesRoute = await loadCoursesRoute()
    const response = await coursesRoute.GET(request("/api/courses?gpa_min=4&gpa_max=1"))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toEqual({ error: "Invalid course query parameters" })
    expect(createClient).not.toHaveBeenCalled()
  })
})

describe("course detail API route", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    setSupabaseEnv()
    redisGet.mockResolvedValue(null)
    redisSet.mockResolvedValue(undefined)
  })

  afterEach(() => {
    restoreSupabaseEnv()
  })

  it("normalizes slug course codes and returns short-code terms in academic order", async () => {
    const courseDetailRoute = await loadCourseDetailRoute()
    const courseChain = createQuery({
      data: {
        id: "course-1",
        course_code: "CISC 124",
        course_name: "Introduction to Computing Science II",
        course_description: "Programming and problem solving.",
        course_requirements: "CISC 121",
        course_units: 3,
        offering_faculty: "Faculty of Arts and Science",
      },
      error: null,
    })
    const distributionsChain = createQuery({
      data: [
        {
          id: 1,
          course_id: "course-1",
          term: "W25",
          enrollment: 120,
          average_gpa: 3.1,
          grade_counts: [10, 20, 70],
        },
        {
          id: 2,
          course_id: "course-1",
          term: "F25",
          enrollment: 140,
          average_gpa: 3.6,
          grade_counts: [20, 30, 50],
        },
        {
          id: 3,
          course_id: "course-1",
          term: "S25",
          enrollment: 80,
          average_gpa: 3.4,
          grade_counts: [15, 35, 50],
        },
      ],
      error: null,
    })
    createClient.mockReturnValue({
      from: selectFrom({
        courses: courseChain,
        course_distributions: distributionsChain,
      }),
    })

    const response = await courseDetailRoute.GET(request("/api/courses/cisc-124"), params("cisc-124"))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(courseChain.calls).toContainEqual({ method: "eq", args: ["course_code", "CISC 124"] })
    expect(data.course).toMatchObject({
      id: "course-1",
      course_code: "CISC 124",
      course_name: "Introduction to Computing Science II",
      description: "Programming and problem solving.",
      course_requirements: "CISC 121",
      credits: 3,
      department: "Faculty of Arts and Science",
      averageGPA: 3.3666666666666667,
      totalEnrollment: 113.33333333333333,
    })
    expect(data.course.distributions.map((distribution: { term: string }) => distribution.term)).toEqual([
      "F25",
      "S25",
      "W25",
    ])
  })

  it("rejects unsafe course code path segments", async () => {
    const courseDetailRoute = await loadCourseDetailRoute()
    const response = await courseDetailRoute.GET(request("/api/courses/..%2F..%2Fetc%2Fpasswd"), params("../../../etc/passwd"))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toEqual({ error: "Invalid course code" })
    expect(createClient).not.toHaveBeenCalled()
  })

  it("returns the current null-course 404 shape when a course is not found", async () => {
    const courseDetailRoute = await loadCourseDetailRoute()
    const courseChain = createQuery({
      data: null,
      error: { message: "No rows returned" },
    })
    createClient.mockReturnValue({ from: selectFrom({ courses: courseChain }) })

    const response = await courseDetailRoute.GET(request("/api/courses/cisc-999"), params("cisc-999"))
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data).toEqual({ course: null })
  })
})
