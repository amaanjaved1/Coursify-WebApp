export const QUEENS_ANSWERS_DISABLED_REASON = "feature_unavailable" as const

export const QUEENS_ANSWERS_DISABLED_ERROR =
  "Queen's Answers is temporarily unavailable while we finish preparing it for launch."

export const QUEENS_ANSWERS_DISABLED_DETAIL =
  "Daily question quotas are paused while the feature is disabled."

export const QUEENS_ANSWERS_DISABLED_RESPONSE_BODY = {
  error: QUEENS_ANSWERS_DISABLED_ERROR,
  reason: QUEENS_ANSWERS_DISABLED_REASON,
  detail: QUEENS_ANSWERS_DISABLED_DETAIL,
} as const
