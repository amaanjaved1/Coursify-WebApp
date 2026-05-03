import { describe, expect, it } from "vitest"
import { parseCourseRows } from "@/lib/pdf/parse-distribution"

const HEADER = "Course Grade Distribution\nQueen's University\nTerm: 2025 Fall\nEnrollment A+ A A- B+ B B- C+ C C- D+ D D- F\n"

function makeLine(code: string, desc: string): string {
  return `${code} ${desc} 100 10 10 10 10 10 10 10 10 10 0 0 0 0`
}

describe("parseCourseRows — is_full_year_part_b", () => {
  it("sets is_full_year_part_b false for a regular course", () => {
    const rows = parseCourseRows(HEADER + makeLine("MATH 121", "Calculus"))
    expect(rows).toHaveLength(1)
    expect(rows[0].is_full_year_part_b).toBe(false)
  })

  it("sets is_full_year_part_b true for a B-suffix course and strips the suffix from course_code", () => {
    const rows = parseCourseRows(HEADER + makeLine("MATH 121B", "Calculus"))
    expect(rows).toHaveLength(1)
    expect(rows[0].course_code).toBe("MATH 121")
    expect(rows[0].is_full_year_part_b).toBe(true)
  })

  it("sets is_full_year_part_b false for an A-suffix course", () => {
    const rows = parseCourseRows(HEADER + makeLine("MATH 121A", "Calculus"))
    expect(rows).toHaveLength(1)
    expect(rows[0].course_code).toBe("MATH 121")
    expect(rows[0].is_full_year_part_b).toBe(false)
  })
})
