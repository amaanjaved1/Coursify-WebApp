// Course Types
export interface Course {
  id: string;
  course_code: string;
  course_name: string;
  description?: string;
  course_requirements?: string | null;
  credits: number;
  department: string;
  average_gpa?: number;
  average_enrollment?: number;
}

export interface CourseDetail extends Course {
  description: string
  terms: string[]
  gpaByTerm: Record<string, number>
  enrollmentByTerm: Record<string, number>
  gradeDistribution: Record<string, Record<string, number>>
}

// Grade Distribution Types
export interface GradeDistribution {
  id: number;
  course_id: string;
  term: string;
  enrollment: number;
  average_gpa: number;
  grade_counts: number[]; // Array of grade percentages
}

export interface GradeSummary {
  category: string
  count: number
  percentage: number
}

// Chat Types
export interface Message {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
}

/** Grade stats (GPA) vs reviews-only vs nothing in catalog/list APIs */
export type CourseDataAvailability = "none" | "comments" | "data"

export type CourseWithStats = Course & {
  distributions: GradeDistribution[];
  averageGPA: number;
  totalEnrollment: number;
  hasComments?: boolean;
  dataAvailability?: CourseDataAvailability;
};

// Server-side pagination types
export interface CoursePageParams {
  page?: number;
  limit?: number;
  search?: string;
  departments?: string[];
  levels?: string[];
  subjects?: string[];
  gpaMin?: number;
  gpaMax?: number;
  enrollmentMin?: number;
  enrollmentMax?: number;
  sortBy?: "code" | "name" | "gpa" | "enrollment" | "availability";
  sortDir?: "asc" | "desc";
  hasData?: boolean;
  /** When set, only these tiers (empty = both). Values: data | comments */
  availability?: ("data" | "comments")[];
}

export interface CoursePageResult {
  courses: CourseWithStats[];
  total: number;
  page: number;
  totalPages: number;
}

// User Profile & Access Types
export interface UserProfile {
  id: string;                         // PK, matches auth.users.id
  display_name: string | null;
  semesters_completed: number;        // 0–8+; set at onboarding
  semester_zero_locked: boolean;      // true once auto-bumped; prevents resetting to 0
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccessStatus {
  has_access: boolean;
  is_exempt: boolean;
  upload_count: number;             // only status='processed' uploads
  required_uploads: number;         // 0 = exempt, 1–6 based on semesters completed
  needs_onboarding: boolean;
  pending_seasonal_upload: boolean; // true if due term not yet uploaded
  due_term: string | null;          // e.g. "Fall 2025"
}

// PDF Upload Types
/** Stored on `distribution_uploads.status` */
export type DistributionUploadStatus = "processed" | "rejected" | "already_uploaded";
export type UploadDistributionFailureReason = "already_uploaded" | "dependency_failure" | "partial_failure";

export interface ParsedCourseRow {
  course_code: string;
  description: string;
  enrollment: number;
  grade_percentages: number[];
  computed_gpa: number;
}

export interface UploadDistributionResponse {
  success: boolean;
  reason?: UploadDistributionFailureReason;
  term?: string;
  inserted: number;
  skipped: string[];
  duplicates: string[];
  errors: string[];
}
