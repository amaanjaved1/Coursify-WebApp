import { createClient } from "@supabase/supabase-js"

// Use environment variables for Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

// Check if environment variables are set
if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables. Please check your .env file.")
  
  // In development, throw an error to make it obvious
  if (process.env.NODE_ENV === "development") {
    throw new Error(
      "Missing Supabase environment variables. Please create a .env.local file with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY"
    )
  }
}

export const getSupabaseServerClient = () => {
  return createClient(supabaseUrl || "", supabaseServiceKey || "", {
    auth: {
      persistSession: false,
    },
  })
}
