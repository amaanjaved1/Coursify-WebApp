import { describe, expect, it } from "vitest"
import {
  normalizeCourseCodeFromPath,
  parseCourseCommentsQuery,
  parseCourseListQuery,
} from "@/app/api/_lib/course-query-validation"

describe("course query validation", () => {
  it("parses default course list query values", () => {
    const parsed = parseCourseListQuery(new URLSearchParams())

    expect(parsed).toMatchObject({
      page: 1,
      limit: 50,
      search: "",
      departments: [],
      levels: [],
      subjects: [],
      gpaMin: 0,
      gpaMax: 4.3,
      enrollMin: 0,
      enrollMax: 0,
      sortBy: "availability",
      sortDir: "desc",
      hasData: true,
      availabilityFilter: [],
    })
  })

  it("accepts current catalog filters without changing expected values", () => {
    const parsed = parseCourseListQuery(
      new URLSearchParams({
        page: "2",
        limit: "25",
        search: "math 121",
        departments: "Faculty of Arts and Science",
        levels: "100,200",
        subjects: "MATH,CISC",
        gpa_min: "1.5",
        gpa_max: "4.0",
        enroll_min: "10",
        enroll_max: "500",
        sort_by: "gpa",
        sort_dir: "asc",
        has_data: "false",
        availability: "data,comments",
      }),
    )

    expect(parsed).toMatchObject({
      page: 2,
      limit: 25,
      search: "math 121",
      departments: ["Faculty of Arts and Science"],
      levels: ["100", "200"],
      subjects: ["MATH", "CISC"],
      gpaMin: 1.5,
      gpaMax: 4,
      enrollMin: 10,
      enrollMax: 500,
      sortBy: "gpa",
      sortDir: "asc",
      hasData: false,
      availabilityFilter: ["data", "comments"],
    })
  })

  it("rejects malformed course list parameters", () => {
    expect(() => parseCourseListQuery(new URLSearchParams({ sort_by: "random" }))).toThrow()
    expect(() => parseCourseListQuery(new URLSearchParams({ gpa_min: "4", gpa_max: "1" }))).toThrow()
    expect(() => parseCourseListQuery(new URLSearchParams({ availability: "data,private" }))).toThrow()
  })

  it("normalizes course search filter-control characters before .or filters are built", () => {
    const parsed = parseCourseListQuery(new URLSearchParams({ search: "MATH (121), CISC" }))

    expect(parsed.search).toBe("MATH 121 CISC")
    expect(parsed.search).not.toMatch(/[(),]/)
  })

  it("rejects unsafe subject filters before course list .or filters are built", () => {
    expect(() => parseCourseListQuery(new URLSearchParams({ subjects: "CISC),course_code.not.is.null" }))).toThrow()
  })

  it("normalizes safe course code path segments", () => {
    expect(normalizeCourseCodeFromPath("math-121")).toBe("MATH 121")
    expect(normalizeCourseCodeFromPath("CISC%20124")).toBe("CISC 124")
  })

  it("rejects unsafe course code path segments", () => {
    expect(normalizeCourseCodeFromPath("../../../etc/passwd")).toBeNull()
    expect(normalizeCourseCodeFromPath("MATH%00121")).toBeNull()
  })

  it("parses comments query values within route-specific bounds", () => {
    const parsed = parseCourseCommentsQuery(
      new URLSearchParams({ mode: "preview", limit: "10", source: "reddit" }),
    )

    expect(parsed).toMatchObject({
      mode: "preview",
      source: "reddit",
      page: 1,
      limit: 10,
      professorFilter: null,
    })
  })
})
