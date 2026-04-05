export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      courses: {
        Row: {
          id: string
          course_code: string
          course_name: string
          course_description: string | null
          course_requirements: string | null
          course_units: number | null
          offering_faculty: string
          course_level: number
        }
        Insert: {
          id?: string
          course_code: string
          course_name: string
          course_description?: string | null
          course_requirements?: string | null
          course_units?: number | null
          offering_faculty?: string
          course_level?: number
        }
        Update: {
          id?: string
          course_code?: string
          course_name?: string
          course_description?: string | null
          course_requirements?: string | null
          course_units?: number | null
          offering_faculty?: string
          course_level?: number
        }
        Relationships: []
      }
      course_distributions: {
        Row: {
          id: number
          course_id: string
          term: string
          enrollment: number
          average_gpa: number
          grade_counts: Json
        }
        Insert: {
          id?: never
          course_id: string
          term: string
          enrollment?: number
          average_gpa?: number
          grade_counts?: Json
        }
        Update: {
          id?: never
          course_id?: string
          term?: string
          enrollment?: number
          average_gpa?: number
          grade_counts?: Json
        }
        Relationships: [
          {
            foreignKeyName: "course_distributions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      rag_chunks: {
        Row: {
          id: string
          source: string
          course_code: string
          text: string
          professor_name: string | null
          source_url: string | null
          tags: Json
          upvotes: number
          quality_rating: number | null
          difficulty_rating: number | null
          sentiment_label: string
          created_at: string
        }
        Insert: {
          id?: string
          source: string
          course_code: string
          text: string
          professor_name?: string | null
          source_url?: string | null
          tags?: Json
          upvotes?: number
          quality_rating?: number | null
          difficulty_rating?: number | null
          sentiment_label?: string
          created_at?: string
        }
        Update: {
          id?: string
          source?: string
          course_code?: string
          text?: string
          professor_name?: string | null
          source_url?: string | null
          tags?: Json
          upvotes?: number
          quality_rating?: number | null
          difficulty_rating?: number | null
          sentiment_label?: string
          created_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          id: string
          display_name: string | null
          semesters_completed: number
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          semesters_completed?: number
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          semesters_completed?: number
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      distribution_uploads: {
        Row: {
          id: string
          user_id: string
          file_path: string
          original_filename: string
          term: string
          status: string
          processed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_path: string
          original_filename: string
          term: string
          status: string
          processed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_path?: string
          original_filename?: string
          term?: string
          status?: string
          processed_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      courses_with_stats: {
        Row: {
          id: string | null
          course_code: string | null
          course_name: string | null
          course_description: string | null
          course_units: number | null
          offering_faculty: string | null
          course_level: number | null
          computed_avg_gpa: number | null
          computed_avg_enrollment: number | null
          has_comments: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends keyof Database["public"]["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof Database["public"]["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends keyof Database["public"]["Enums"] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never
