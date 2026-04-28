import type { CoursePageParams, GradeDistribution } from "@/types"
import type { Json, Tables } from "@/types/database.types"

export const COURSE_SORT_COLUMNS = ["availability", "code", "name", "gpa", "enrollment"] as const
export const COURSE_SORT_DIRECTIONS = ["asc", "desc"] as const
export const COURSE_AVAILABILITY_FILTERS = ["data", "comments"] as const
export const COMMENT_MODES = ["preview", "paginated"] as const
export const COMMENT_SOURCES = ["reddit", "rmp", "all"] as const

export type CourseSortColumn = (typeof COURSE_SORT_COLUMNS)[number]
export type CourseSortDirection = (typeof COURSE_SORT_DIRECTIONS)[number]
export type CourseAvailabilityFilter = (typeof COURSE_AVAILABILITY_FILTERS)[number]
export type CourseCommentMode = (typeof COMMENT_MODES)[number]
export type CourseCommentSource = (typeof COMMENT_SOURCES)[number]

type CourseDistributionRow = Tables<"course_distributions">

function gradeCountsArray(value: Json): number[] {
  return Array.isArray(value) ? (value as number[]) : []
}

export function isCourseAvailabilityFilter(value: string): value is CourseAvailabilityFilter {
  return COURSE_AVAILABILITY_FILTERS.includes(value as CourseAvailabilityFilter)
}

export function courseCodeToPathSegment(courseCode: string): string {
  return courseCode.trim().replace(/\s+/g, "-").toLowerCase()
}

export function normalizeCourseCodeFromPath(segment: string): string | null {
  try {
    const normalized = decodeURIComponent(segment)
      .replace(/-/g, " ")
      .trim()
      .replace(/\s+/g, " ")
      .toUpperCase()

    if (!normalized || normalized.length > 40) return null
    if (!/^[A-Z0-9]+(?: [A-Z0-9]+)*$/.test(normalized)) return null
    return normalized
  } catch {
    return null
  }
}

export function serializeCoursePageParams(params: CoursePageParams): URLSearchParams {
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

  return searchParams
}

export function toGradeDistribution(row: CourseDistributionRow): GradeDistribution {
  return {
    id: Number(row.id) || 0,
    course_id: String(row.course_id) || "",
    term: String(row.term) || "",
    enrollment: Number(row.enrollment) || 0,
    average_gpa: Number(row.average_gpa) || 0,
    grade_counts: gradeCountsArray(row.grade_counts),
  }
}
