import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { filterRmpTagsForDisplay } from "@/lib/rmp-comment-tags"
import { redis } from "@/lib/redis"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

function normalizeCourseCodeFromPath(segment: string): string {
  return decodeURIComponent(segment).replace(/-/g, " ").trim().replace(/\s+/g, " ").toUpperCase()
}

interface CachedRedditComment {
  text: string
  course_code: string
  professor_name: string
  source_url: string
  tags: string[]
  upvotes: number
  sentiment_label: string
}

interface CachedRmpComment {
  text: string
  course_code: string
  professor_name: string
  source_url: string
  tags: string[]
  quality_rating: number
  difficulty_rating: number
  sentiment_label: string
}

interface CachedPayload {
  redditComments: CachedRedditComment[]
  rmpComments: CachedRmpComment[]
}

async function getOrFetchComments(courseCode: string): Promise<CachedPayload> {
  const cacheKey = `course_comments:${courseCode}`

  // Try cache first
  const cached = await redis.get<CachedPayload>(cacheKey)
  if (cached) return cached

  if (!supabaseUrl || !supabaseKey) {
    return { redditComments: [], rmpComments: [] }
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  const [redditResult, rmpResult] = await Promise.all([
    supabase
      .from("rag_chunks")
      .select("text, course_code, professor_name, source_url, tags, upvotes, sentiment_label")
      .eq("course_code", courseCode)
      .eq("source", "reddit")
      .order("upvotes", { ascending: false }),
    supabase
      .from("rag_chunks")
      .select(
        "text, course_code, professor_name, source_url, tags, quality_rating, difficulty_rating, sentiment_label, created_at"
      )
      .eq("course_code", courseCode)
      .eq("source", "ratemyprofessors")
      .order("created_at", { ascending: false }),
  ])

  if (redditResult.error) {
    console.error("Error fetching reddit comments:", redditResult.error)
  }
  if (rmpResult.error) {
    console.error("Error fetching RMP comments:", rmpResult.error)
  }

  const redditComments = (redditResult.data || []).map((row: Record<string, unknown>) => ({
    text: String(row.text ?? ""),
    course_code: String(row.course_code ?? ""),
    professor_name: String(row.professor_name ?? ""),
    source_url: String(row.source_url ?? ""),
    tags: Array.isArray(row.tags) ? row.tags : [],
    upvotes: Number(row.upvotes) || 0,
    sentiment_label: String(row.sentiment_label ?? "neutral"),
  }))

  const rmpComments = (rmpResult.data || []).map((row: Record<string, unknown>) => ({
    text: String(row.text ?? ""),
    course_code: String(row.course_code ?? ""),
    professor_name: String(row.professor_name ?? ""),
    source_url: String(row.source_url ?? ""),
    tags: filterRmpTagsForDisplay(
      Array.isArray(row.tags) ? (row.tags as string[]).filter((t): t is string => typeof t === "string") : []
    ),
    quality_rating: Number(row.quality_rating) || 0,
    difficulty_rating: Number(row.difficulty_rating) || 0,
    sentiment_label: String(row.sentiment_label ?? "neutral"),
  }))

  const payload: CachedPayload = { redditComments, rmpComments }
  await redis.set(cacheKey, payload, { ex: 43200 }) // 12 hours
  return payload
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ courseCode: string }> }
) {
  const { courseCode: rawSegment } = await context.params
  const courseCode = normalizeCourseCodeFromPath(rawSegment)

  if (!courseCode) {
    return NextResponse.json({ error: "Invalid course code" }, { status: 400 })
  }

  const { searchParams } = request.nextUrl
  const mode = searchParams.get("mode") || "paginated"

  try {
    const { redditComments, rmpComments } = await getOrFetchComments(courseCode)

    // ── Preview mode: return a small slice of each source (1 API call for carousel) ──
    if (mode === "preview") {
      const previewLimit = Math.max(1, Math.min(20, parseInt(searchParams.get("limit") || "5", 10)))
      return NextResponse.json({
        redditComments: redditComments.slice(0, previewLimit),
        rmpComments: rmpComments.slice(0, previewLimit),
        redditTotal: redditComments.length,
        rmpTotal: rmpComments.length,
      })
    }

    // ── Paginated mode: single-source pagination for the detail page ──
    const source = (searchParams.get("source") || "all") as "reddit" | "rmp" | "all"
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)))
    const professorFilter = searchParams.get("professor") || null

    type TaggedComment =
      | (CachedRedditComment & { _type: "reddit" })
      | (CachedRmpComment & { _type: "rmp" })

    let comments: TaggedComment[] = []

    if (source === "reddit" || source === "all") {
      comments.push(...redditComments.map(c => ({ ...c, _type: "reddit" as const })))
    }
    if (source === "rmp" || source === "all") {
      comments.push(...rmpComments.map(c => ({ ...c, _type: "rmp" as const })))
    }

    // Apply professor filter
    if (professorFilter) {
      comments = comments.filter(c => c.professor_name === professorFilter)
    }

    // Pagination
    const total = comments.length
    const totalPages = Math.ceil(total / limit)
    const startIndex = (page - 1) * limit
    const paginatedComments = comments.slice(startIndex, startIndex + limit)

    // Build professor counts for sidebar (from source-filtered, non-professor-filtered list)
    const professorCounts: Record<string, number> = {}
    const sourceFiltered =
      source === "reddit"
        ? redditComments.map(c => ({ ...c, _type: "reddit" as const }))
        : source === "rmp"
          ? rmpComments.map(c => ({ ...c, _type: "rmp" as const }))
          : [
              ...redditComments.map(c => ({ ...c, _type: "reddit" as const })),
              ...rmpComments.map(c => ({ ...c, _type: "rmp" as const })),
            ]

    for (const c of sourceFiltered) {
      if (c.professor_name && c.professor_name !== "general_prof") {
        professorCounts[c.professor_name] = (professorCounts[c.professor_name] || 0) + 1
      }
    }

    return NextResponse.json({
      comments: paginatedComments,
      total,
      page,
      totalPages,
      redditTotal: redditComments.length,
      rmpTotal: rmpComments.length,
      professorCounts,
    })
  } catch (err) {
    console.error("Course comments API error:", err)
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
  }
}
