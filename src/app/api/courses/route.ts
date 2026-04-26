import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createHash } from "crypto"
import { computeDataAvailability } from "@/lib/course-availability"
import type { Database, Tables } from "@/lib/database.types"
import { redis } from "@/lib/redis"
import { parseCourseListQuery } from "@/app/api/_lib/course-query-validation"
import { ZodError } from "zod"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

const CACHE_TTL = 14400 // 4 hours
type CourseWithStatsRow = Tables<"courses_with_stats">

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  let parsedParams: ReturnType<typeof parseCourseListQuery>
  try {
    parsedParams = parseCourseListQuery(searchParams)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid course query parameters" }, { status: 400 })
    }
    throw error
  }

  const {
    page,
    limit,
    search,
    departments,
    levels,
    subjects,
    gpaMin,
    gpaMax,
    enrollMin,
    enrollMax,
    sortBy,
    sortDir,
    hasData,
    availabilityFilter,
  } = parsedParams

  // Build a stable cache key from validated params (hashed to prevent cache poisoning)
  const cacheKeyPayload = JSON.stringify(parsedParams)
  const cacheKey = `courses:${createHash("sha256").update(cacheKeyPayload).digest("hex")}`

  try {
    const cached = await redis.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseKey)

    let query = supabase
      .from("courses_with_stats")
      .select("*", { count: "exact" })

    // Text search
    if (search) {
      query = query.or(
        `course_code.ilike.%${search}%,course_name.ilike.%${search}%`
      )
    }

    // Department filter
    if (departments.length > 0) {
      query = query.in("offering_faculty", departments)
    }

    // Level filter
    if (levels.length > 0) {
      query = query.in("course_level", levels.map(Number))
    }

    // Subject prefix filter (e.g. CISC, APSC, ANAT)
    if (subjects.length > 0) {
      const subjectFilter = subjects
        .map((s) => `course_code.ilike.${s} %`)
        .join(",")
      query = query.or(subjectFilter)
    }

    // GPA range filter (only if not default range)
    if (gpaMin > 0 || gpaMax < 4.3) {
      query = query
        .gte("computed_avg_gpa", gpaMin)
        .lte("computed_avg_gpa", gpaMax)
    }

    // Enrollment range filter
    if (enrollMin > 0) {
      query = query.gte("computed_avg_enrollment", enrollMin)
    }
    if (enrollMax > 0) {
      query = query.lte("computed_avg_enrollment", enrollMax)
    }

    // Main table: grade data OR aggregated comments; exclude courses with neither
    if (hasData) {
      query = query.or("computed_avg_gpa.gt.0,has_comments.eq.true")
    }

    // Optional: restrict to tier(s) — values data | comments (comma-separated)
    if (availabilityFilter.length > 0) {
      const wantData = availabilityFilter.includes("data")
      const wantComments = availabilityFilter.includes("comments")
      if (wantData && !wantComments) {
        query = query.gt("computed_avg_gpa", 0)
      } else if (!wantData && wantComments) {
        query = query
          .eq("has_comments", true)
          .lte("computed_avg_gpa", 0)
      }
      // both selected: no extra tier filter
    }

    // Sorting — availability: data first when sort_dir=desc (gpa high→low puts >0 before 0); comments first when asc
    if (sortBy === "availability") {
      const dataFirst = sortDir === "desc"
      query = query
        .order("computed_avg_gpa", { ascending: !dataFirst })
        .order("course_code", { ascending: true })
    } else {
      const sortColumn = {
        code: "course_code",
        name: "course_name",
        gpa: "computed_avg_gpa",
        enrollment: "computed_avg_enrollment",
      }[sortBy] || "course_code"

      query = query.order(sortColumn, { ascending: sortDir === "asc" })
    }

    // Pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data, count, error } = await query

    if (error) {
      console.error("Error fetching courses:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    // Map to CourseWithStats shape
    const courses = (data || []).map((row: CourseWithStatsRow) => {
      const averageGPA = Number(row.computed_avg_gpa) || 0
      const hasComments = Boolean(row.has_comments)
      return {
        id: String(row.id),
        course_code: row.course_code || "",
        course_name: row.course_name || "",
        description: row.course_description || undefined,
        credits: Number(row.course_units || 0),
        department: row.offering_faculty || "",
        distributions: [],
        averageGPA,
        totalEnrollment: Number(row.computed_avg_enrollment) || 0,
        hasComments,
        dataAvailability: computeDataAvailability(averageGPA, hasComments),
      }
    })

    const payload = { courses, total, page, totalPages }
    await redis.set(cacheKey, payload, { ex: CACHE_TTL })
    return NextResponse.json(payload)
  } catch (err) {
    console.error("Courses API error:", err)
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    )
  }
}
