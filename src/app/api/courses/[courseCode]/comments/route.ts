import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { filterRmpTagsForDisplay } from "@/lib/rmp-comment-tags"
import { redis } from "@/lib/redis"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

function normalizeCourseCodeFromPath(segment: string): string {
  return decodeURIComponent(segment).replace(/-/g, " ").trim().replace(/\s+/g, " ").toUpperCase()
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ courseCode: string }> }
) {
  const { courseCode: rawSegment } = await context.params
  const courseCode = normalizeCourseCodeFromPath(rawSegment)

  if (!courseCode) {
    return NextResponse.json({ error: "Invalid course code" }, { status: 400 })
  }

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })
  }

  const cacheKey = `course_comments:${courseCode}`

  try {
    const cached = await redis.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
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

    const payload = { redditComments, rmpComments }
    await redis.set(cacheKey, payload, { ex: 43200 }) // 12 hours
    return NextResponse.json(payload)
  } catch (err) {
    console.error("Course comments API error:", err)
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
  }
}
