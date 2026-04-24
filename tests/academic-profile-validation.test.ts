import { describe, expect, it } from "vitest"
import {
  SEMESTER_ZERO_LOCKED_ERROR,
  getSemestersCompletedValidationError,
  isSemesterZeroLocked,
} from "@/app/api/_lib/academic-profile-validation"

describe("academic profile validation", () => {
  it("accepts integer semester values from zero through eight", () => {
    expect(getSemestersCompletedValidationError(0)).toBeNull()
    expect(getSemestersCompletedValidationError(4)).toBeNull()
    expect(getSemestersCompletedValidationError(8)).toBeNull()
  })

  it("rejects invalid semester values", () => {
    expect(getSemestersCompletedValidationError(-1)).toBe("semesters_completed must be 0–8")
    expect(getSemestersCompletedValidationError(9)).toBe("semesters_completed must be 0–8")
    expect(getSemestersCompletedValidationError(1.5)).toBe("semesters_completed must be 0–8")
    expect(getSemestersCompletedValidationError("2")).toBe("semesters_completed must be 0–8")
  })

  it("locks only semester-zero updates for users whose zero state has been frozen", () => {
    expect(isSemesterZeroLocked(0, true)).toBe(true)
    expect(isSemesterZeroLocked(0, false)).toBe(false)
    expect(isSemesterZeroLocked(1, true)).toBe(false)
    expect(SEMESTER_ZERO_LOCKED_ERROR).toContain("can no longer be set to 0")
  })
})
