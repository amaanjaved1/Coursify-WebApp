import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

type RagRow = {
  text: string
  course_code: string
  professor_name: string | null
  source_url: string | null
  tags: string[]
  upvotes?: number
  quality_rating?: number | null
  difficulty_rating?: number | null
  sentiment_label: string
  created_at: string | null
}

type RagResult = { data: RagRow[] | null; error: { message: string } | null }
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

async function loadCommentsRoute() {
  return import("@/app/api/courses/[courseCode]/comments/route")
}

function request(path: string): NextRequest {
  return new NextRequest(`http://localhost${path}`)
}

function params(courseCode: string): { params: Promise<{ courseCode: string }> } {
  return { params: Promise.resolve({ courseCode }) }
}

function createRagQuery(results: { reddit: RagResult; ratemyprofessors: RagResult }, calls: QueryCall[]) {
  let selectedSource: "reddit" | "ratemyprofessors" | null = null
  const query = {
    eq: vi.fn((...args: unknown[]) => {
      calls.push({ method: "eq", args })
      if (args[0] === "source" && (args[1] === "reddit" || args[1] === "ratemyprofessors")) {
        selectedSource = args[1]
      }
      return query
    }),
    order: vi.fn((...args: unknown[]) => {
      calls.push({ method: "order", args })
      if (!selectedSource) throw new Error("Source filter was not applied")
      return Promise.resolve(results[selectedSource])
    }),
  }

  return query
}

function createSupabase(results: { reddit: RagResult; ratemyprofessors: RagResult }, calls: QueryCall[]) {
  return {
    from: vi.fn((table: string) => {
      if (table !== "rag_chunks") throw new Error(`Unexpected table: ${table}`)
      return {
        select: vi.fn(() => createRagQuery(results, calls)),
      }
    }),
  }
}

const redditRows: RagRow[] = [
  {
    text: "Project-heavy but useful.",
    course_code: "CISC 124",
    professor_name: "general_prof",
    source_url: "https://reddit.test/1",
    tags: ["projects"],
    upvotes: 12,
    sentiment_label: "positive",
    created_at: "2025-01-01",
  },
  {
    text: "Ada section had clear lectures.",
    course_code: "CISC 124",
    professor_name: "Dr. Ada",
    source_url: "https://reddit.test/2",
    tags: ["lectures"],
    upvotes: 8,
    sentiment_label: "positive",
    created_at: "2025-01-02",
  },
]

const rmpRows: RagRow[] = [
  {
    text: "Helpful office hours.",
    course_code: "CISC 124",
    professor_name: "Dr. Ada",
    source_url: "https://rmp.test/1",
    tags: ["Hilarious", "Skip class? You won't pass."],
    quality_rating: 4.5,
    difficulty_rating: 3,
    sentiment_label: "positive",
    created_at: "2025-02-01",
  },
  {
    text: "Assignments were fair.",
    course_code: "CISC 124",
    professor_name: "Dr. Turing",
    source_url: "https://rmp.test/2",
    tags: ["Tough grader"],
    quality_rating: 4,
    difficulty_rating: 3.5,
    sentiment_label: "neutral",
    created_at: "2025-02-02",
  },
]

describe("course comments API route", () => {
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

  it("returns preview slices with aggregate totals for both comment sources", async () => {
    const commentsRoute = await loadCommentsRoute()
    const calls: QueryCall[] = []
    createClient.mockReturnValue(
      createSupabase(
        {
          reddit: { data: redditRows, error: null },
          ratemyprofessors: { data: rmpRows, error: null },
        },
        calls,
      ),
    )

    const response = await commentsRoute.GET(
      request("/api/courses/cisc-124/comments?mode=preview&limit=1"),
      params("cisc-124"),
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toMatchObject({
      redditTotal: 2,
      rmpTotal: 2,
      redditComments: [{ text: "Project-heavy but useful.", course_code: "CISC 124" }],
      rmpComments: [{ text: "Helpful office hours.", course_code: "CISC 124" }],
    })
    expect(data.redditComments).toHaveLength(1)
    expect(data.rmpComments).toHaveLength(1)
    expect(calls).toContainEqual({ method: "eq", args: ["course_code", "CISC 124"] })
  })

  it("paginates comments, tags source type, and builds professor counts from the selected source", async () => {
    const commentsRoute = await loadCommentsRoute()
    const calls: QueryCall[] = []
    createClient.mockReturnValue(
      createSupabase(
        {
          reddit: { data: redditRows, error: null },
          ratemyprofessors: { data: rmpRows, error: null },
        },
        calls,
      ),
    )

    const response = await commentsRoute.GET(
      request("/api/courses/cisc-124/comments?source=rmp&page=2&limit=1"),
      params("cisc-124"),
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toMatchObject({
      total: 2,
      page: 2,
      totalPages: 2,
      redditTotal: 2,
      rmpTotal: 2,
      professorCounts: {
        "Dr. Ada": 1,
        "Dr. Turing": 1,
      },
    })
    expect(data.comments).toEqual([
      expect.objectContaining({
        _type: "rmp",
        text: "Assignments were fair.",
        professor_name: "Dr. Turing",
      }),
    ])
  })

  it("filters paginated comments by professor without changing source aggregate totals", async () => {
    const commentsRoute = await loadCommentsRoute()
    const calls: QueryCall[] = []
    createClient.mockReturnValue(
      createSupabase(
        {
          reddit: { data: redditRows, error: null },
          ratemyprofessors: { data: rmpRows, error: null },
        },
        calls,
      ),
    )

    const response = await commentsRoute.GET(
      request("/api/courses/cisc-124/comments?source=all&professor=Dr.%20Ada&limit=10"),
      params("cisc-124"),
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.total).toBe(2)
    expect(data.redditTotal).toBe(2)
    expect(data.rmpTotal).toBe(2)
    expect(data.comments.map((comment: { professor_name: string }) => comment.professor_name)).toEqual([
      "Dr. Ada",
      "Dr. Ada",
    ])
    expect(data.professorCounts).toEqual({
      "Dr. Ada": 2,
      "Dr. Turing": 1,
    })
  })

  it("returns empty successful shapes when comment sources are empty", async () => {
    const commentsRoute = await loadCommentsRoute()
    const calls: QueryCall[] = []
    createClient.mockReturnValue(
      createSupabase(
        {
          reddit: { data: [], error: null },
          ratemyprofessors: { data: null, error: null },
        },
        calls,
      ),
    )

    const response = await commentsRoute.GET(
      request("/api/courses/cisc-124/comments?mode=preview"),
      params("cisc-124"),
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      redditComments: [],
      rmpComments: [],
      redditTotal: 0,
      rmpTotal: 0,
    })
  })

  it("rejects malformed pagination query parameters before creating a Supabase client", async () => {
    const commentsRoute = await loadCommentsRoute()
    const response = await commentsRoute.GET(
      request("/api/courses/cisc-124/comments?page=0"),
      params("cisc-124"),
    )
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toEqual({ error: "Invalid comments query parameters" })
    expect(createClient).not.toHaveBeenCalled()
  })
})
