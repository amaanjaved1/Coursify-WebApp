export const SEMESTER_ZERO_LOCKED_ERROR =
  "Your account has been active for over a semester, so “semesters completed” can no longer be set to 0. If this seems incorrect, please use the Report a Bug feature."

export function getSemestersCompletedValidationError(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 8) {
    return "semesters_completed must be 0–8"
  }

  return null
}

export function isSemesterZeroLocked(
  semestersCompleted: number,
  semesterZeroLocked: boolean | null | undefined,
): boolean {
  return semestersCompleted === 0 && Boolean(semesterZeroLocked)
}
