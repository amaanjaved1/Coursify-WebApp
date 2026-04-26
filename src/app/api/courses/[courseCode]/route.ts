import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type { Database, Tables } from "@/lib/database.types"
import type { CourseWithStats, GradeDistribution } from "@/types"
import { redis } from "@/lib/redis"
import { normalizeCourseCodeFromPath } from "@/app/api/_lib/course-query-validation"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
type CourseDistributionRow = Tables<"course_distributions">

function toGradeDistribution(row: CourseDistributionRow): GradeDistribution {
  return {
    id: Number(row.id) || 0,
    course_id: String(row.course_id) || "",
    term: String(row.term) || "",
    enrollment: Number(row.enrollment) || 0,
    average_gpa: Number(row.average_gpa) || 0,
    grade_counts: Array.isArray(row.grade_counts) ? (row.grade_counts as number[]) : [],
  }
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

  const cacheKey = `course:${courseCode}`

  try {
    const cached = await redis.get(cacheKey)
    if (cached) {
      return NextResponse.json({ course: cached })
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseKey)

    const { data: courseData, error: courseError } = await supabase
      .from("courses")
      .select("*")
      .eq("course_code", courseCode)
      .single()

    if (courseError || !courseData) {
      return NextResponse.json({ course: null }, { status: 404 })
    }

    const courseId = String(courseData.id)

    const { data: distributionsData, error: distError } = await supabase
      .from("course_distributions")
      .select("*")
      .eq("course_id", courseId)
      .order("term", { ascending: false })

    if (distError) {
      console.error(`Error fetching distributions for course ${courseCode}:`, distError)
    }

    const distributions = (distError ? [] : distributionsData || []).map(toGradeDistribution)

    const uniqueDistributions = Array.from(new Map(distributions.map((d) => [d.term, d])).values())

    const totalGPA = uniqueDistributions.reduce((sum, dist) => sum + dist.average_gpa, 0)
    const totalEnrollment = uniqueDistributions.reduce((sum, dist) => sum + dist.enrollment, 0)
    const averageGPA = uniqueDistributions.length > 0 ? totalGPA / uniqueDistributions.length : 0
    const avgEnrollment =
      uniqueDistributions.length > 0 ? totalEnrollment / uniqueDistributions.length : 0

    const course: CourseWithStats = {
      id: courseId,
      course_code: String(courseData.course_code),
      course_name: String(courseData.course_name),
      description: courseData.course_description ? String(courseData.course_description) : undefined,
      course_requirements:
        courseData.course_requirements !== null && courseData.course_requirements !== undefined
          ? String(courseData.course_requirements)
          : null,
      credits: Number(courseData.course_units || 0),
      department: String(courseData.offering_faculty || ""),
      distributions: uniqueDistributions,
      averageGPA,
      totalEnrollment: avgEnrollment,
    }

    await redis.set(cacheKey, course, { ex: 7200 }) // 2 hours
    return NextResponse.json({ course })
  } catch (err) {
    console.error("Course by code API error:", err)
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 })
  }
}
