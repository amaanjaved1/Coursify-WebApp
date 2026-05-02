import { describe, expect, it } from "vitest"
import { calculateAccessStatus } from "@/app/api/_lib/confirmed-access-status"

describe("calculateAccessStatus", () => {
  it("requires onboarding when no profile exists", () => {
    const { status, semestersCompleted } = calculateAccessStatus({
      profile: null,
      uploadCount: 0,
      dueTerm: "F25",
      hasSeasonalUpload: false,
    })

    expect(semestersCompleted).toBeNull()
    expect(status).toEqual({
      has_access: false,
      is_exempt: true,
      upload_count: 0,
      required_uploads: 0,
      needs_onboarding: true,
      pending_seasonal_upload: false,
      due_term: null,
    })
  })

  it("keeps first-semester users exempt after onboarding", () => {
    const { status } = calculateAccessStatus({
      profile: { onboarding_completed: true, semesters_completed: 0 },
      uploadCount: 0,
      dueTerm: "W26",
      hasSeasonalUpload: false,
    })

    expect(status).toMatchObject({
      has_access: true,
      is_exempt: true,
      required_uploads: 0,
      needs_onboarding: false,
      pending_seasonal_upload: false,
      due_term: null,
    })
  })

  it("caps the base upload quota at six semesters", () => {
    const { status } = calculateAccessStatus({
      profile: { onboarding_completed: true, semesters_completed: 8 },
      uploadCount: 6,
      dueTerm: null,
      hasSeasonalUpload: false,
    })

    expect(status.required_uploads).toBe(6)
    expect(status.has_access).toBe(true)
  })

  it("denies access when the base upload quota is not met", () => {
    const { status } = calculateAccessStatus({
      profile: { onboarding_completed: true, semesters_completed: 3 },
      uploadCount: 2,
      dueTerm: null,
      hasSeasonalUpload: false,
    })

    expect(status).toMatchObject({
      has_access: false,
      is_exempt: false,
      upload_count: 2,
      required_uploads: 3,
      pending_seasonal_upload: false,
      due_term: null,
    })
  })

  it("denies access during a seasonal gate until the due term has been uploaded", () => {
    const { status } = calculateAccessStatus({
      profile: { onboarding_completed: true, semesters_completed: 4 },
      uploadCount: 4,
      dueTerm: "F25",
      hasSeasonalUpload: false,
    })

    expect(status).toMatchObject({
      has_access: false,
      pending_seasonal_upload: true,
      due_term: "F25",
    })
  })

  it("grants access when both base quota and seasonal upload are satisfied", () => {
    const { status } = calculateAccessStatus({
      profile: { onboarding_completed: true, semesters_completed: 4 },
      uploadCount: 4,
      dueTerm: "F25",
      hasSeasonalUpload: true,
    })

    expect(status).toMatchObject({
      has_access: true,
      pending_seasonal_upload: false,
      due_term: "F25",
    })
  })
})
