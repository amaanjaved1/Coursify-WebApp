/**
 * RateMyProfessor UI tags are short phrases (often title case, may include spaces).
 * Pipeline / DB metadata is often stored as lowercase snake_case (e.g. professor_review).
 */
export function filterRmpTagsForDisplay(tags: string[]): string[] {
  // The RMP scraper stores both:
  // 1) official RMP chip labels (e.g. "Caring", "Tough grader")
  // 2) internal canonical bucket tags (e.g. "grading", "workload")
  //
  // We only want (1) to render in the UI, and we also want consistent casing,
  // because DB values may come in all-caps (e.g. "EXTRA CREDIT").
  const seen = new Set<string>()
  const out: string[] = []

  for (const rawTag of tags) {
    const canonicalDisplay = toCanonicalDisplayTag(rawTag)
    if (!canonicalDisplay) continue

    const key = canonicalDisplay.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(canonicalDisplay)
  }

  return out
}

function isInternalRmpPipelineTag(tag: string): boolean {
  const t = tag.trim().toLowerCase()
  if (!t) return true
  // Chunk/source labels and similar — not RMP attribute chips
  if (/^[a-z0-9_]+$/.test(t) && t.includes("_")) return true
  return false
}

// Official RateMyProfessors “attribute chips” scraped in `rmp-scraper.py`:
// keys of `RMP_TAG_TO_CANONICAL`.
const OFFICIAL_RMP_CHIPS = [
  "Tough grader",
  "Clear grading criteria",
  "Graded by few things",
  "Inspirational",
  "Amazing lectures",
  "Respected",
  "Caring",
  "Hilarious",
  "Accessible outside class",
  "Gives good feedback",
  "Lots of homework",
  "Get ready to read",
  "So many papers",
  "Group projects",
  "Test heavy",
  "Beware of pop quizzes",
  "Tests? Not many",
  "Skip class? You won't pass.",
  "Lecture heavy",
  "Participation matters",
  "Online savvy",
  "Extra credit",
  "Would take again",
  "Would not take again",
] as const

const OFFICIAL_RMP_CHIPS_BY_LOWER = new Map<string, string>(
  OFFICIAL_RMP_CHIPS.map((t) => [t.toLowerCase(), t]),
)

function toCanonicalDisplayTag(tag: string): string | null {
  const normalized = tag?.trim().replace(/\s+/g, " ")
  if (!normalized) return null
  if (isInternalRmpPipelineTag(normalized)) return null

  const mapped = OFFICIAL_RMP_CHIPS_BY_LOWER.get(normalized.toLowerCase())
  if (!mapped) return null

  // Force consistent chip casing for display.
  return toRmpTitleCase(mapped)
}

function toRmpTitleCase(s: string): string {
  // Your "official" casing expectation: Title Case (words capitalized),
  // even if the DB value was stored as ALLCAPS.
  //
  // Important: don't uppercase the letter right after an apostrophe in contractions
  // (e.g. "won't" should be "Won't", not "Won'T").
  const lower = s.toLowerCase()
  return lower
    .replace(/\b[a-z]/g, (m) => m.toUpperCase())
    .replace(/'([A-Z])/g, (_m, c: string) => `'${c.toLowerCase()}'`)
}
