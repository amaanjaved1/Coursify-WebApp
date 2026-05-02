import { describe, expect, it } from "vitest"
import { getCurrentSeasonalDueTerm, toCanonicalTermCode } from "@/lib/seasonal-term-policy"

describe("seasonal term policy", () => {
  it("converts SOLUS full terms to canonical short codes", () => {
    expect(toCanonicalTermCode("2025 Fall")).toBe("F25")
    expect(toCanonicalTermCode("2026 Winter")).toBe("W26")
    expect(toCanonicalTermCode("2025 Summer")).toBe("S25")
  })

  it("also normalizes legacy full-label terms", () => {
    expect(toCanonicalTermCode("Fall 2025")).toBe("F25")
    expect(toCanonicalTermCode("Winter 2026")).toBe("W26")
  })

  it("maps the February-April window to previous Fall", () => {
    expect(getCurrentSeasonalDueTerm(new Date("2026-02-01T12:00:00Z"))).toBe("F25")
    expect(getCurrentSeasonalDueTerm(new Date("2026-04-28T12:00:00Z"))).toBe("F25")
  })

  it("maps the May-August window to current Winter", () => {
    expect(getCurrentSeasonalDueTerm(new Date("2026-05-15T12:00:00Z"))).toBe("W26")
    expect(getCurrentSeasonalDueTerm(new Date("2026-08-15T12:00:00Z"))).toBe("W26")
  })

  it("returns null outside seasonal windows", () => {
    expect(getCurrentSeasonalDueTerm(new Date("2026-01-31T12:00:00Z"))).toBeNull()
    expect(getCurrentSeasonalDueTerm(new Date("2026-04-29T12:00:00Z"))).toBeNull()
    expect(getCurrentSeasonalDueTerm(new Date("2026-08-16T12:00:00Z"))).toBeNull()
  })

  it("uses UTC calendar boundaries for seasonal windows", () => {
    expect(getCurrentSeasonalDueTerm(new Date("2026-04-28T23:59:59Z"))).toBe("F25")
    expect(getCurrentSeasonalDueTerm(new Date("2026-04-29T00:00:00Z"))).toBeNull()
    expect(getCurrentSeasonalDueTerm(new Date("2026-05-14T23:59:59Z"))).toBeNull()
    expect(getCurrentSeasonalDueTerm(new Date("2026-05-15T00:00:00Z"))).toBe("W26")
  })
})
