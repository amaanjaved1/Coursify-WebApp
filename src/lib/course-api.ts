import {
  courseCodeToPathSegment,
  serializeCoursePageParams,
} from "@/lib/course-contracts"
import type { CoursePageParams, CoursePageResult, CourseWithStats } from "@/types"
import type {
  CourseCommentsPreviewResult,
  PaginatedCommentsParams,
  PaginatedCommentsResult,
} from "@/lib/comment-contracts"

function emptyPreviewComments(): CourseCommentsPreviewResult {
  return {
    redditComments: [],
    rmpComments: [],
    redditTotal: 0,
    rmpTotal: 0,
  }
}

function emptyPaginatedComments(): PaginatedCommentsResult {
  return {
    comments: [],
    total: 0,
    page: 1,
    totalPages: 0,
    redditTotal: 0,
    rmpTotal: 0,
    professorCounts: {},
  }
}

export async function fetchCoursesPage(params: CoursePageParams): Promise<CoursePageResult> {
  const searchParams = serializeCoursePageParams(params)
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
    const slug = courseCodeToPathSegment(courseCode)
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

export async function getCommentsForCourse(
  courseCode: string,
  limit?: number
): Promise<CourseCommentsPreviewResult> {
  if (!courseCode.trim()) return emptyPreviewComments()
  try {
    const slug = courseCodeToPathSegment(courseCode)
    const fetchLimit = limit ?? 5
    const res = await fetch(
      `/api/courses/${encodeURIComponent(slug)}/comments?mode=preview&limit=${fetchLimit}`
    )
    if (!res.ok) {
      console.error("getCommentsForCourse API error:", res.status, res.statusText)
      return emptyPreviewComments()
    }
    const data = (await res.json()) as Partial<CourseCommentsPreviewResult>
    return {
      redditComments: data.redditComments ?? [],
      rmpComments: data.rmpComments ?? [],
      redditTotal: data.redditTotal ?? 0,
      rmpTotal: data.rmpTotal ?? 0,
    }
  } catch (error) {
    console.error("Error in getCommentsForCourse:", error)
    return emptyPreviewComments()
  }
}

export async function getCommentsForCoursePaginated(
  params: PaginatedCommentsParams
): Promise<PaginatedCommentsResult> {
  if (!params.courseCode.trim()) return emptyPaginatedComments()
  try {
    const slug = courseCodeToPathSegment(params.courseCode)
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
      return emptyPaginatedComments()
    }
    return (await res.json()) as PaginatedCommentsResult
  } catch (error) {
    console.error("Error in getCommentsForCoursePaginated:", error)
    return emptyPaginatedComments()
  }
}
