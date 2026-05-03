import type { ParsedCourseRow } from "@/types";
import { toCanonicalTermCode } from "@/lib/seasonal-term-policy";

// Queen's University GPA scale
const GPA_SCALE = [4.3, 4.0, 3.7, 3.3, 3.0, 2.7, 2.3, 2.0, 1.7, 1.3, 1.0, 0.7, 0.0];

export interface ValidationResult {
  valid: boolean;
  term?: string;
  error?: string;
}

/**
 * Validate that the extracted PDF text matches the SOLUS grade distribution format.
 */
export function validateSolusFormat(text: string): ValidationResult {
  if (!text.includes("Course Grade Distribution")) {
    return { valid: false, error: "This doesn't appear to be a SOLUS grade distribution PDF. Missing 'Course Grade Distribution' header." };
  }

  if (!text.includes("Queen's University") && !text.includes("Queens University")) {
    return { valid: false, error: "This PDF is not from Queen's University." };
  }

  const termMatch = text.match(/Term:\s*(\d{4}\s+(?:Winter|Fall|Summer))/i);
  if (!termMatch) {
    return { valid: false, error: "Could not find a valid term (e.g., '2024 Winter') in the PDF." };
  }

  // Check for grade table column headers
  if (!text.includes("Enrollment") || !text.includes("A+")) {
    return { valid: false, error: "Could not find the grade distribution table in the PDF." };
  }

  const term = toCanonicalTermCode(termMatch[1]);
  if (!term) {
    return { valid: false, error: "Could not normalize the SOLUS term." };
  }

  return { valid: true, term };
}

/**
 * Calculate weighted GPA from grade percentages.
 */
function calculateGpa(percentages: number[]): number {
  let weightedSum = 0;
  for (let i = 0; i < 13; i++) {
    weightedSum += percentages[i] * GPA_SCALE[i];
  }
  return Math.round((weightedSum / 100) * 100) / 100;
}

/**
 * Normalize a row for parsing: drop % suffixes on numbers and thousands
 * separators inside integers (e.g. "1,500" → "1500"), and convert a few
 * common "empty cell" glyphs to zero so a single missing cell doesn't
 * kill the whole row.
 */
function normalizeRow(text: string): string {
  return text
    .replace(/(\d),(\d{3}(?:\b|\D))/g, "$1$2")
    .replace(/(\d(?:\.\d+)?)%/g, "$1")
    .replace(/\s[—–−-](?=\s|$)/g, " 0")
    .replace(/\bN\/A\b/gi, "0");
}

/**
 * Parse a single line of text into a course row, or return null if it doesn't match.
 */
function parseCourseLine(line: string): ParsedCourseRow | null {
  const trimmed = normalizeRow(line.trim());
  if (!trimmed) return null;

  // Match course code at start: 2-5 uppercase letters, space, 3-4 digits, optional letter suffix
  const codeMatch = trimmed.match(/^([A-Z]{2,5}\s+\d{3,4}[A-Z]?)\s+/);
  if (!codeMatch) return null;

  const rawCode = codeMatch[1];
  const courseCode = rawCode.replace(/[A-Z]$/, "");
  const is_full_year_part_b = /B$/.test(rawCode);
  const rest = trimmed.slice(codeMatch[0].length).trim();

  const tokens = rest.split(/\s+/);
  if (tokens.length < 15) return null; // at least 1 description word + 14 numbers

  // Walk from the right, collecting numeric tokens until we have 14.
  // This is resilient to descriptions that contain numbers (e.g. "Chemistry 2").
  const numericTokens: string[] = [];
  let cut = tokens.length;
  for (let i = tokens.length - 1; i >= 0 && numericTokens.length < 14; i--) {
    if (/^-?\d+(?:\.\d+)?$/.test(tokens[i])) {
      numericTokens.unshift(tokens[i]);
      cut = i;
    } else {
      break;
    }
  }
  if (numericTokens.length !== 14) return null;

  const descriptionTokens = tokens.slice(0, cut);
  if (descriptionTokens.length === 0) return null;

  const numbers = numericTokens.map(Number);
  const enrollment = Math.round(numbers[0]);
  if (enrollment <= 0) return null;

  const gradePercentages = numbers.slice(1); // 13 values

  // Validate percentages sum roughly to 100 (widened tolerance for rounding
  // across 13 cells in older SOLUS exports)
  const sum = gradePercentages.reduce((a, b) => a + b, 0);
  if (sum < 85 || sum > 115) return null;

  return {
    course_code: courseCode,
    description: descriptionTokens.join(" "),
    enrollment,
    grade_percentages: gradePercentages,
    computed_gpa: calculateGpa(gradePercentages),
    is_full_year_part_b,
  };
}

/**
 * Parse all course rows from the extracted PDF text.
 */
export function parseCourseRows(text: string): ParsedCourseRow[] {
  const lines = text.split("\n");
  const courses: ParsedCourseRow[] = [];

  for (const line of lines) {
    const parsed = parseCourseLine(line);
    if (parsed) {
      courses.push(parsed);
    }
  }

  return courses;
}

/**
 * Extract text from a PDF buffer using pdfjs-dist.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  // Pre-register the worker so pdfjs-dist skips its dynamic import("./pdf.worker.mjs")
  // which fails on Vercel serverless. See pdf.mjs line 17501: globalThis.pdfjsWorker check.
  if (typeof (globalThis as any).pdfjsWorker === "undefined") {
    const pdfjsWorker = await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
    (globalThis as any).pdfjsWorker = pdfjsWorker;
  }

  const uint8 = new Uint8Array(buffer);
  const doc = await pdfjsLib.getDocument({
    data: uint8,
    useSystemFonts: true,
    disableFontFace: true,
    isEvalSupported: false,
    useWorkerFetch: false,
  }).promise;

  // Group text items by their baseline Y coordinate and sort by X within each
  // row. This avoids relying on `item.hasEOL` (unreliable across SOLUS PDF
  // generator versions — rows often merge) and on intrinsic whitespace
  // between items (tabular layouts put each cell in its own item with no
  // trailing space, which would otherwise glue cells together).
  const Y_EPSILON = 2; // points — tolerance for same-row detection
  const textParts: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();

    const rows: Array<{ y: number; items: Array<{ x: number; str: string }> }> = [];

    for (const item of content.items as any[]) {
      if (typeof item.str !== "string" || item.str.length === 0) continue;
      const transform = item.transform as number[] | undefined;
      if (!transform || transform.length < 6) continue;
      const x = transform[4];
      const y = transform[5];

      // Find an existing row within Y_EPSILON, else start a new one.
      let row = rows.find((r) => Math.abs(r.y - y) <= Y_EPSILON);
      if (!row) {
        row = { y, items: [] };
        rows.push(row);
      }
      row.items.push({ x, str: item.str });
    }

    // PDF coordinates: Y increases upward, so top-to-bottom is descending Y.
    rows.sort((a, b) => b.y - a.y);
    for (const row of rows) {
      row.items.sort((a, b) => a.x - b.x);
      const line = row.items
        .map((it) => it.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (line) textParts.push(line);
    }
  }

  await doc.destroy();
  return textParts.join("\n");
}
