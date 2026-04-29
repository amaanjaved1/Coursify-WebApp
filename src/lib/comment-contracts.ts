import type { CourseCommentSource } from "@/lib/course-contracts"

export interface RedditComment {
  text: string
  course_code: string
  professor_name: string
  source_url: string
  tags: string[]
  upvotes: number
  sentiment_label: string
  created_at: string | null
}

export interface RmpComment {
  text: string
  course_code: string
  professor_name: string
  source_url: string
  tags: string[]
  quality_rating: number
  difficulty_rating: number
  sentiment_label: string
  created_at: string | null
}

export interface CourseCommentsPayload {
  redditComments: RedditComment[]
  rmpComments: RmpComment[]
}

export interface CourseCommentsPreviewResult extends CourseCommentsPayload {
  redditTotal: number
  rmpTotal: number
}

export interface PaginatedCommentsParams {
  courseCode: string
  source: CourseCommentSource
  page?: number
  limit?: number
  professor?: string
}

export type TaggedComment =
  | (RedditComment & { _type: "reddit" })
  | (RmpComment & { _type: "rmp" })

export interface PaginatedCommentsResult {
  comments: TaggedComment[]
  total: number
  page: number
  totalPages: number
  redditTotal: number
  rmpTotal: number
  professorCounts: Record<string, number>
}
