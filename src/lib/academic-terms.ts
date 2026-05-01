type AcademicTerm = {
  term: string;
};

const TERM_SEASON_ORDER: Record<string, number> = {
  W: 1,
  S: 2,
  F: 3,
};

function academicTermSortKey(term: string): number | null {
  const match = term.match(/^([FWS])(\d{2})$/i);
  if (!match) return null;

  const [, seasonCode, shortYear] = match;
  const seasonOrder = TERM_SEASON_ORDER[seasonCode.toUpperCase()];
  const year = 2000 + Number.parseInt(shortYear, 10);

  if (!seasonOrder || !Number.isFinite(year)) return null;

  return year * 10 + seasonOrder;
}

function compareAcademicTerms(a: string, b: string, direction: "asc" | "desc"): number {
  const aKey = academicTermSortKey(a);
  const bKey = academicTermSortKey(b);

  if (aKey != null && bKey != null) {
    return direction === "asc" ? aKey - bKey : bKey - aKey;
  }

  if (aKey != null) return -1;
  if (bKey != null) return 1;

  return a.localeCompare(b);
}

export function sortByAcademicTermAscending<T extends AcademicTerm>(items: T[]): T[] {
  return [...items].sort((a, b) => compareAcademicTerms(a.term, b.term, "asc"));
}

export function sortByAcademicTermDescending<T extends AcademicTerm>(items: T[]): T[] {
  return [...items].sort((a, b) => compareAcademicTerms(a.term, b.term, "desc"));
}
