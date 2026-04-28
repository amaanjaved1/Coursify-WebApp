import { z } from "zod";

const SORT_COLUMNS = ["availability", "code", "name", "gpa", "enrollment"] as const;
const SORT_DIRECTIONS = ["asc", "desc"] as const;
const AVAILABILITY_FILTERS = ["data", "comments"] as const;
const COMMENT_MODES = ["preview", "paginated"] as const;
const COMMENT_SOURCES = ["reddit", "rmp", "all"] as const;

function normalizeCourseSearchText(value: string): string {
  return value.replace(/[(),]/g, " ").replace(/\s+/g, " ").trim();
}

const boundedText = z.string().trim().max(120);
const courseSearchText = z.string().max(240).transform(normalizeCourseSearchText).pipe(boundedText);
const listItem = z.string().trim().min(1).max(80);
const subjectCode = z.string().trim().regex(/^[A-Za-z0-9]{1,12}$/);

function parsePositiveInt(raw: string | null, fallback: number): number {
  if (raw === null || raw.trim() === "") return fallback;
  const value = Number(raw);
  return Number.isInteger(value) ? value : Number.NaN;
}

function parseFiniteNumber(raw: string | null, fallback: number): number {
  if (raw === null || raw.trim() === "") return fallback;
  return Number(raw);
}

function parseCsv(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function requireValidCsv<T>(raw: string | null, schema: z.ZodType<T>): T {
  return schema.parse(parseCsv(raw));
}

const csvSchema = z.array(listItem).max(30);
const levelCsvSchema = z.array(z.string().regex(/^\d{1,3}$/)).max(10);
const subjectCsvSchema = z.array(subjectCode).max(30);
const availabilityCsvSchema = z.array(z.enum(AVAILABILITY_FILTERS)).max(2);

export type CourseListQuery = {
  page: number;
  limit: number;
  search: string;
  departments: string[];
  levels: string[];
  subjects: string[];
  gpaMin: number;
  gpaMax: number;
  enrollMin: number;
  enrollMax: number;
  sortBy: (typeof SORT_COLUMNS)[number];
  sortDir: (typeof SORT_DIRECTIONS)[number];
  hasData: boolean;
  availabilityFilter: (typeof AVAILABILITY_FILTERS)[number][];
};

export function parseCourseListQuery(searchParams: URLSearchParams): CourseListQuery {
  const page = z.number().int().min(1).max(10000).parse(parsePositiveInt(searchParams.get("page"), 1));
  const limit = z.number().int().min(1).max(100).parse(parsePositiveInt(searchParams.get("limit"), 50));
  const search = courseSearchText.parse(searchParams.get("search") ?? "");
  const departments = requireValidCsv(searchParams.get("departments"), csvSchema);
  const levels = requireValidCsv(searchParams.get("levels"), levelCsvSchema);
  const subjects = requireValidCsv(searchParams.get("subjects"), subjectCsvSchema);
  const gpaMin = z.number().min(0).max(4.3).parse(parseFiniteNumber(searchParams.get("gpa_min"), 0));
  const gpaMax = z.number().min(0).max(4.3).parse(parseFiniteNumber(searchParams.get("gpa_max"), 4.3));
  const enrollMin = z.number().min(0).max(100000).parse(parseFiniteNumber(searchParams.get("enroll_min"), 0));
  const enrollMax = z.number().min(0).max(100000).parse(parseFiniteNumber(searchParams.get("enroll_max"), 0));
  const sortBy = z.enum(SORT_COLUMNS).parse(searchParams.get("sort_by") ?? "availability");
  const sortDir = z.enum(SORT_DIRECTIONS).parse(searchParams.get("sort_dir") ?? "desc");
  const rawHasData = searchParams.get("has_data");
  const hasData = rawHasData === null ? true : z.enum(["true", "false"]).transform((value) => value === "true").parse(rawHasData);
  const availabilityFilter = requireValidCsv(searchParams.get("availability"), availabilityCsvSchema);

  if (gpaMin > gpaMax) {
    throw new z.ZodError([
      {
        code: z.ZodIssueCode.custom,
        path: ["gpa_min"],
        message: "gpa_min must be less than or equal to gpa_max",
      },
    ]);
  }

  if (enrollMax > 0 && enrollMin > enrollMax) {
    throw new z.ZodError([
      {
        code: z.ZodIssueCode.custom,
        path: ["enroll_min"],
        message: "enroll_min must be less than or equal to enroll_max",
      },
    ]);
  }

  return {
    page,
    limit,
    search,
    departments,
    levels,
    subjects,
    gpaMin,
    gpaMax,
    enrollMin,
    enrollMax,
    sortBy,
    sortDir,
    hasData,
    availabilityFilter,
  };
}

export function normalizeCourseCodeFromPath(segment: string): string | null {
  try {
    const normalized = decodeURIComponent(segment)
      .replace(/-/g, " ")
      .trim()
      .replace(/\s+/g, " ")
      .toUpperCase();

    if (!normalized || normalized.length > 40) return null;
    if (!/^[A-Z0-9]+(?: [A-Z0-9]+)*$/.test(normalized)) return null;
    return normalized;
  } catch {
    return null;
  }
}

export type CourseCommentsQuery = {
  mode: (typeof COMMENT_MODES)[number];
  source: (typeof COMMENT_SOURCES)[number];
  page: number;
  limit: number;
  professorFilter: string | null;
};

export function parseCourseCommentsQuery(searchParams: URLSearchParams): CourseCommentsQuery {
  const mode = z.enum(COMMENT_MODES).parse(searchParams.get("mode") ?? "paginated");
  const source = z.enum(COMMENT_SOURCES).parse(searchParams.get("source") ?? "all");
  const page = z.number().int().min(1).max(10000).parse(parsePositiveInt(searchParams.get("page"), 1));
  const maxLimit = mode === "preview" ? 20 : 100;
  const fallbackLimit = mode === "preview" ? 5 : 20;
  const limit = z.number().int().min(1).max(maxLimit).parse(parsePositiveInt(searchParams.get("limit"), fallbackLimit));
  const professor = searchParams.get("professor");
  const professorFilter = professor ? boundedText.parse(professor) : null;

  return {
    mode,
    source,
    page,
    limit,
    professorFilter,
  };
}
