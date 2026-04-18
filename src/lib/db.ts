import { getSupabaseClient } from "./supabase/client"
import type { Course, GradeDistribution, CourseWithStats, CoursePageParams, CoursePageResult } from "@/types"

// Always use real Supabase data, never mock data
export let isUsingMockData = false;

// Helper function to safely convert a database row to a GradeDistribution
function toGradeDistribution(row: any): GradeDistribution {
  return {
    id: Number(row.id) || 0,
    course_id: String(row.course_id) || "",
    term: String(row.term) || "",
    enrollment: Number(row.enrollment) || 0,
    average_gpa: Number(row.average_gpa) || 0,
    grade_counts: Array.isArray(row.grade_counts) ? row.grade_counts : []
  };
}

// Fetch all courses with statistics
export async function getAllCourses(): Promise<CourseWithStats[]> {
  try {
    console.log("Getting Supabase client...");
    const supabase = getSupabaseClient();
    console.log("Fetching courses from Supabase...");
    
    // Get all distributions first (they're usually fewer than courses)
    const { data: distributionsData, error: distError } = await supabase
      .from('course_distributions')
      .select('*');

    if (distError) {
      console.error('Error fetching distributions:', distError);
      return [];
    }

    console.log(`Successfully fetched ${distributionsData?.length || 0} distributions`);
    
    // Create a map of course IDs to their distributions for faster lookup
    const distributionsByCourseId = new Map<string, any[]>();
    distributionsData?.forEach(dist => {
      const courseId = String(dist.course_id);
      if (!distributionsByCourseId.has(courseId)) {
        distributionsByCourseId.set(courseId, []);
      }
      distributionsByCourseId.get(courseId)?.push(dist);
    });
    
    // Now get all courses
    const { data: coursesData, error: coursesError } = await supabase
      .from('courses')
      .select('*');

    if (coursesError) {
      console.error('Error fetching courses:', coursesError);
      return [];
    }

    console.log(`Successfully fetched ${coursesData?.length || 0} courses`);
    
    // Map courses with their distributions
    const coursesWithStats: CourseWithStats[] = coursesData.map((course: any) => {
      const courseId = String(course.id);
      const courseDistributionsData = distributionsByCourseId.get(courseId) || [];
      const courseDistributions = courseDistributionsData.map(toGradeDistribution);
        
      // Filter out duplicate distributions by term to ensure consistency
      const uniqueDistributions = Array.from(
        new Map(courseDistributions.map(dist => [dist.term, dist]))
        .values()
      );
        
      // Calculate average GPA and enrollment
      const totalGPA = uniqueDistributions.reduce(
        (sum, dist) => sum + dist.average_gpa, 
        0
      );
      const totalEnrollment = uniqueDistributions.reduce(
        (sum, dist) => sum + dist.enrollment, 
        0
      );
      
      const averageGPA = uniqueDistributions.length > 0 ? totalGPA / uniqueDistributions.length : 0;
      const avgEnrollment = uniqueDistributions.length > 0 ? totalEnrollment / uniqueDistributions.length : 0;

      return {
        id: String(course.id || ""),
        course_code: String(course.course_code || ""),
        course_name: String(course.course_name || ""),
        description: course.course_description ? String(course.course_description) : undefined,
        credits: Number(course.course_units || 0),
        department: String(course.offering_faculty || ""),
        distributions: courseDistributions,
        averageGPA,
        totalEnrollment: avgEnrollment
      };
    });
    
    console.log(`Returning ${coursesWithStats.length} courses`);
    
    return coursesWithStats;
  } catch (error) {
    console.error('Error in getAllCourses:', error);
    return [];
  }
}

// Fetch paginated, filtered courses from the API route
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

// Fetch departments list from API
export async function fetchDepartments(): Promise<string[]> {
  const res = await fetch("/api/courses/departments")
  if (!res.ok) {
    console.error("Failed to fetch departments:", res.statusText)
    return []
  }
  const data = await res.json()
  return data.departments || []
}

// Fetch subject prefixes (e.g. CISC, APSC, ANAT) from API
export async function fetchSubjects(): Promise<string[]> {
  const res = await fetch("/api/courses/subjects")
  if (!res.ok) {
    console.error("Failed to fetch subjects:", res.statusText)
    return []
  }
  const data = await res.json()
  return data.subjects || []
}

// Get a single course by code (via server API so signed-in users are not blocked by RLS on direct client queries)
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

export async function searchCourses(query: string): Promise<CourseWithStats[]> {
  try {
    const supabase = getSupabaseClient();
    
    // Filter courses by the search query
    const allCourses = await getAllCourses();
    
    if (!query) return allCourses;
    
    const lowerQuery = query.toLowerCase();
    return allCourses.filter(course => 
      course.course_code.toLowerCase().includes(lowerQuery) ||
      course.course_name.toLowerCase().includes(lowerQuery) ||
      (course.description && course.description.toLowerCase().includes(lowerQuery))
    );
  } catch (error) {
    console.error("Error in searchCourses:", error);
    return [];
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

    // Single API call — preview mode returns both sources with a per-source limit
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

// Debug function to inspect database structure
export async function debugDatabaseStructure(): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    
    // Get course_distributions structure
    const { data: distData, error: distError } = await supabase
      .from('course_distributions')
      .select('*')
      .limit(1);
      
    if (distError) {
      console.error("Error getting course_distributions:", distError);
    } else if (distData && distData.length > 0) {
      console.log("course_distributions fields:", Object.keys(distData[0]));
      console.log("course_distributions sample:", distData[0]);
    }
    
    // Get courses structure
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .limit(1);
      
    if (courseError) {
      console.error("Error getting courses:", courseError);
    } else if (courseData && courseData.length > 0) {
      console.log("courses fields:", Object.keys(courseData[0]));
      console.log("courses sample:", courseData[0]);
    }
  } catch (e) {
    console.error("Exception in debugDatabaseStructure:", e);
  }
}
