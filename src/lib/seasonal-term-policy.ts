type Season = "Fall" | "Winter" | "Summer"

const SEASON_CODES: Record<Season, string> = {
  Fall: "F",
  Winter: "W",
  Summer: "S",
}

const FULL_TERM_PATTERN = /^(?:(\d{4})\s+(Fall|Winter|Summer)|(Fall|Winter|Summer)\s+(\d{4}))$/i

export function toCanonicalTermCode(term: string): string | null {
  const match = term.trim().match(FULL_TERM_PATTERN)
  if (!match) return null

  const year = match[1] ?? match[4]
  const seasonInput = match[2] ?? match[3]
  const season = seasonInput[0].toUpperCase() + seasonInput.slice(1).toLowerCase() as Season

  return `${SEASON_CODES[season]}${year.slice(-2)}`
}

export function getCurrentSeasonalDueTerm(now = new Date()): string | null {
  const month = now.getMonth() + 1
  const day = now.getDate()
  const year = now.getFullYear()

  if (month === 2 || month === 3 || (month === 4 && day <= 28)) {
    return toCanonicalTermCode(`${year - 1} Fall`)
  }

  if ((month === 5 && day >= 15) || month === 6 || month === 7 || (month === 8 && day <= 15)) {
    return toCanonicalTermCode(`${year} Winter`)
  }

  return null
}
