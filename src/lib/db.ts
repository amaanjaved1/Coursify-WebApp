import { getSupabaseClient } from "./supabase/client"
import type { Tables } from "@/types/database.types"
import type { GradeDistribution, CourseWithStats, CoursePageParams, CoursePageResult } from "@/types"

type CourseRow = Tables<"courses">
type CourseDistributionRow = Tables<"course_distributions">

function toGradeDistribution(row: CourseDistributionRow): GradeDistribution {
  return {
    id: Number(row.id) || 0,
    course_id: String(row.course_id) || "",
    term: String(row.term) || "",
    enrollment: Number(row.enrollment) || 0,
    average_gpa: Number(row.average_gpa) || 0,
    grade_counts: Array.isArray(row.grade_counts)
      ? (row.grade_counts as unknown[]).filter((v): v is number => typeof v === "number")
      : []
  };
}

export async function fetchCoursesPage(params: CoursePageParams): Promise<CoursePageResult> {
  const searchParams = new URLSearchParams()

  if (params.page) searchParams.set("page", String(params.page))
  if (params.limit) searchParams.set("limit", String(params.limit))
  if (params.search) searchParams.set("search", params.search)
  if (params.departments?.length) searchParams.set("departments", params.departments.join(","))
  if (params.levels?.length) searchParams.set("levels", params.levels.join(","))
  if (params.subjects?.length) searchParams.set("subjects", params.subjects.join(","))
  if (params.gpaMin !== undefined && params.gpaMin > 0) searchParams.set("gpa_min", String(params.gpaMin))
  if (params.gpaMax !== undefined && params.gpaMax < 4.3) searchParams.set("gpa_max", String(params.gpaMax))
  if (params.enrollmentMin !== undefined && params.enrollmentMin > 0) searchParams.set("enroll_min", String(params.enrollmentMin))
  if (params.enrollmentMax !== undefined && params.enrollmentMax > 0) searchParams.set("enroll_max", String(params.enrollmentMax))
  if (params.sortBy) searchParams.set("sort_by", params.sortBy)
  if (params.sortDir) searchParams.set("sort_dir", params.sortDir)
  if (params.hasData !== undefined) searchParams.set("has_data", String(params.hasData))
  if (params.availability?.length) searchParams.set("availability", params.availability.join(","))

  const res = await fetch(`/api/courses?${searchParams.toString()}`)
  if (!res.ok) {
    console.error("Failed to fetch courses page:", res.statusText)
    return { courses: [], total: 0, page: 1, totalPages: 0 }
  }
  return res.json()
}

export async function fetchDepartments(): Promise<string[]> {
  const res = await fetch("/api/courses/departments")
  if (!res.ok) {
    console.error("Failed to fetch departments:", res.statusText)
    return []
  }
  const data = await res.json()
  return data.departments || []
}

export async function fetchSubjects(): Promise<string[]> {
  const res = await fetch("/api/courses/subjects")
  if (!res.ok) {
    console.error("Failed to fetch subjects:", res.statusText)
    return []
  }
  const data = await res.json()
  return data.subjects || []
}

export async function getCourseByCode(courseCode: string): Promise<CourseWithStats | null> {
  if (!courseCode.trim()) return null
  try {
    const slug = courseCode.trim().replace(/\s+/g, "-").toLowerCase()
    const res = await fetch(`/api/courses/${encodeURIComponent(slug)}`)
    if (res.status === 404) return null
    if (!res.ok) {
      console.error(`getCourseByCode API error (${res.status}):`, res.statusText)
      return null
    }
    const data = (await res.json()) as { course?: CourseWithStats | null }
    return data.course ?? null
  } catch (error) {
    console.error(`Error in getCourseByCode:`, error)
    return null
  }
}

export async function getCourseDistributions(courseId: string, term: string): Promise<GradeDistribution | null> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('course_distributions')
      .select('*')
      .eq('course_id', courseId)
      .eq('term', term)
      .single();
    if (error || !data) {
      console.error(`Error fetching grade distribution for course ${courseId}, term ${term}:`, error);
      return null;
    }
    return toGradeDistribution(data);
  } catch (error) {
    console.error(`Error in getCourseDistributions:`, error);
    return null;
  }
}

export interface RedditComment {
  text: string;
  course_code: string;
  professor_name: string;
  source_url: string;
  tags: string[];
  upvotes: number;
  sentiment_label: string;
  created_at: string | null;
}

export interface RmpComment {
  text: string;
  course_code: string;
  professor_name: string;
  source_url: string;
  tags: string[];
  quality_rating: number;
  difficulty_rating: number;
  sentiment_label: string;
  created_at: string | null;
}

export async function getCommentsForCourse(
  courseCode: string,
  limit?: number
): Promise<{
  redditComments: RedditComment[];
  rmpComments: RmpComment[];
  redditTotal: number;
  rmpTotal: number;
}> {
  if (!courseCode.trim()) return { redditComments: [], rmpComments: [], redditTotal: 0, rmpTotal: 0 }
  try {
    const slug = courseCode.trim().replace(/\s+/g, "-").toLowerCase()
    const fetchLimit = limit ?? 5
    const res = await fetch(
      `/api/courses/${encodeURIComponent(slug)}/comments?mode=preview&limit=${fetchLimit}`
    )
    if (!res.ok) {
      console.error("getCommentsForCourse API error:", res.status, res.statusText)
      return { redditComments: [], rmpComments: [], redditTotal: 0, rmpTotal: 0 }
    }
    const data = await res.json()
    return {
      redditComments: (data.redditComments ?? []) as RedditComment[],
      rmpComments: (data.rmpComments ?? []) as RmpComment[],
      redditTotal: data.redditTotal ?? 0,
      rmpTotal: data.rmpTotal ?? 0,
    }
  } catch (error) {
    console.error("Error in getCommentsForCourse:", error)
    return { redditComments: [], rmpComments: [], redditTotal: 0, rmpTotal: 0 }
  }
}

export interface PaginatedCommentsParams {
  courseCode: string
  source: "reddit" | "rmp" | "all"
  page?: number
  limit?: number
  professor?: string
}

export interface PaginatedCommentsResult {
  comments: (RedditComment & { _type: "reddit" } | RmpComment & { _type: "rmp" })[]
  total: number
  page: number
  totalPages: number
  redditTotal: number
  rmpTotal: number
  professorCounts: Record<string, number>
}

export async function getCommentsForCoursePaginated(
  params: PaginatedCommentsParams
): Promise<PaginatedCommentsResult> {
  const empty: PaginatedCommentsResult = {
    comments: [],
    total: 0,
    page: 1,
    totalPages: 0,
    redditTotal: 0,
    rmpTotal: 0,
    professorCounts: {},
  }
  if (!params.courseCode.trim()) return empty
  try {
    const slug = params.courseCode.trim().replace(/\s+/g, "-").toLowerCase()
    const searchParams = new URLSearchParams()
    searchParams.set("source", params.source)
    searchParams.set("page", String(params.page ?? 1))
    searchParams.set("limit", String(params.limit ?? 20))
    if (params.professor) searchParams.set("professor", params.professor)
    const res = await fetch(
      `/api/courses/${encodeURIComponent(slug)}/comments?${searchParams.toString()}`
    )
    if (!res.ok) {
      console.error("getCommentsForCoursePaginated API error:", res.status, res.statusText)
      return empty
    }
    return (await res.json()) as PaginatedCommentsResult
  } catch (error) {
    console.error("Error in getCommentsForCoursePaginated:", error)
    return empty
  }
}
