import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"
import { redis } from "@/lib/redis"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

const CACHE_KEY = "subjects:list"
const CACHE_TTL = 86400 // 24 hours

export async function GET() {
  try {
    const cached = await redis.get<string[]>(CACHE_KEY)
    if (cached) {
      return NextResponse.json({ subjects: cached })
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseKey)

    const { data, error } = await supabase
      .from("courses_with_stats")
      .select("course_code")

    if (error) {
      console.error("Error fetching subjects:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const subjects = [
      ...new Set(
        (data || [])
          .map((row) => {
            const code = row.course_code || ""
            return code.split(" ")[0].trim().toUpperCase()
          })
          .filter(Boolean)
      ),
    ].sort() as string[]

    await redis.set(CACHE_KEY, subjects, { ex: CACHE_TTL })

    return NextResponse.json({ subjects })
  } catch (err) {
    console.error("Subjects API error:", err)
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
      { status: 500 }
    )
  }
}
