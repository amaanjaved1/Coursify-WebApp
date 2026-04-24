import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"

// Use environment variables for Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Warn in development when environment variables are missing
if ((!supabaseUrl || !supabaseAnonKey) && process.env.NODE_ENV === "development") {
  console.warn(
    "Missing Supabase environment variables. " +
    "Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file."
  )
}

// Create a singleton instance for client-side usage
let supabaseClient: SupabaseClient<Database> | null = null

export const getSupabaseClient = (): SupabaseClient<Database> => {
  if (!supabaseClient) {
    supabaseClient = createClient<Database>(
      supabaseUrl || "",
      supabaseAnonKey || ""
    )
  }
  return supabaseClient
}
