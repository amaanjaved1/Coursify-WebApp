import { describe, expect, it } from "vitest"
import { buildAuthHref, getSafeRedirectPath } from "@/lib/auth/safe-redirect"

describe("auth redirect helpers", () => {
  it("allows same-origin relative redirect paths", () => {
    expect(getSafeRedirectPath("/settings", "/onboarding")).toBe("/settings")
    expect(getSafeRedirectPath("/queens-answers?course=CISC", "/onboarding")).toBe(
      "/queens-answers?course=CISC",
    )
  })

  it("rejects external, protocol-relative, encoded, and oversized redirects", () => {
    expect(getSafeRedirectPath("https://evil.example", "/onboarding")).toBe("/onboarding")
    expect(getSafeRedirectPath("//evil.example/path", "/onboarding")).toBe("/onboarding")
    expect(getSafeRedirectPath("%2F%2Fevil.example/path", "/onboarding")).toBe("/onboarding")
    expect(getSafeRedirectPath(`/${"a".repeat(2049)}`, "/onboarding")).toBe("/onboarding")
  })

  it("builds auth links without redirect loops back into auth pages", () => {
    expect(buildAuthHref("/sign-in", "/queens-answers")).toBe(
      "/sign-in?redirect=%2Fqueens-answers",
    )
    expect(buildAuthHref("/sign-in", "/sign-up?redirect=%2Fsettings")).toBe("/sign-in")
  })
})
