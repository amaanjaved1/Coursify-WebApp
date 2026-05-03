import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSupabaseFromRequest } from "@/app/api/_lib/authenticated-supabase";
import { checkRateLimit } from "@/app/api/_lib/rate-limit";
import { extractTextFromPdf, validateSolusFormat, parseCourseRows } from "@/lib/pdf/parse-distribution";
import type { UploadDistributionResponse } from "@/types";
import { redis } from "@/lib/redis";
import { createGitHubIssue } from "@/lib/github/create-issue";

export const runtime = "nodejs";

function deriveCourseLevel(code: string): number {
  const match = code.match(/[A-Z]\s+(\d)/);
  const level = match ? parseInt(match[1], 10) : 1;
  return Math.min(Math.max(level, 1), 6);
}

function failureResponse(
  response: Omit<UploadDistributionResponse, "success" | "inserted" | "skipped" | "stubs_created" | "duplicates" | "errors"> &
    Partial<Pick<UploadDistributionResponse, "inserted" | "skipped" | "stubs_created" | "duplicates">> & {
      errors: string[];
      reason?: UploadDistributionResponse["reason"];
    },
  status: number,
) {
  return NextResponse.json(
    {
      success: false,
      inserted: response.inserted ?? 0,
      skipped: response.skipped ?? [],
      stubs_created: response.stubs_created ?? [],
      duplicates: response.duplicates ?? [],
      ...response,
    },
    { status },
  );
}

function safeUploadFileName(name: string): string {
  const cleaned = name.replace(/[^\w.\-]+/g, "_").slice(0, 120);
  return cleaned || "upload.pdf";
}

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedSupabaseFromRequest(request);
  if (!auth.ok && auth.reason === "server_configuration") {
    return failureResponse(
      {
        errors: ["Upload service is temporarily unavailable."],
        reason: "dependency_failure",
      },
      500,
    );
  }

  if (!auth.ok && auth.reason === "missing_token") {
    return NextResponse.json({ success: false, errors: ["Please sign in to upload."] }, { status: 401 });
  }
  if (!auth.ok && auth.reason === "forbidden_domain") {
    return NextResponse.json({ success: false, errors: [auth.error] }, { status: 403 });
  }
  if (!auth.ok) {
    return NextResponse.json({ success: false, errors: ["Authentication failed. Please sign in again."] }, { status: 401 });
  }

  const { supabase, user } = auth;

  const rateLimit = await checkRateLimit({
    keyPrefix: "upload-distribution:user",
    identifier: user.id,
    limit: 8,
    windowSeconds: 60 * 60,
  });
  if (!rateLimit.ok && rateLimit.reason === "dependency_failure") {
    console.warn("[upload-distribution] rate-limit unavailable, failing open");
  }
  if (!rateLimit.ok && rateLimit.reason !== "dependency_failure") {
    return failureResponse(
      {
        errors: ["You've reached the limit of 8 uploads per hour. Try again in 1 hour."],
      },
      429,
    );
  }

  // 2. Extract file from FormData
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ success: false, errors: ["Invalid request. Expected a file upload."] }, { status: 400 });
  }

  const formKeys = Array.from(formData.keys());
  if (formKeys.some((key) => key !== "file") || formData.getAll("file").length !== 1) {
    return NextResponse.json({ success: false, errors: ["Invalid upload payload."] }, { status: 400 });
  }

  const fileEntry = formData.get("file");
  if (!fileEntry) {
    return NextResponse.json({ success: false, errors: ["No file provided."] }, { status: 400 });
  }

  if (!(fileEntry instanceof File)) {
    return NextResponse.json({ success: false, errors: ["Invalid request. Expected a file upload."] }, { status: 400 });
  }

  const file = fileEntry;
  const safeFileName = safeUploadFileName(file.name);

  // 3. Validate file type and size
  if (file.type !== "application/pdf") {
    return NextResponse.json({ success: false, errors: ["File must be a PDF."] }, { status: 400 });
  }

  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ success: false, errors: ["File must be under 5MB."] }, { status: 400 });
  }

  if (file.name.length > 255) {
    return NextResponse.json({ success: false, errors: ["File name is too long."] }, { status: 400 });
  }

  // 4. Extract text from PDF
  let text: string;
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Verify PDF magic bytes (%PDF) to prevent non-PDF files with a spoofed MIME type
    if (buffer.length < 4 || buffer.subarray(0, 4).toString("ascii") !== "%PDF") {
      return NextResponse.json({ success: false, errors: ["File does not appear to be a valid PDF."] }, { status: 400 });
    }

    text = await extractTextFromPdf(buffer);
  } catch (pdfError) {
    console.error("PDF parsing error:", pdfError);
    return NextResponse.json({ success: false, errors: ["Failed to read PDF. The file may be corrupted."] }, { status: 400 });
  }

  // 5. Validate SOLUS format
  const validation = validateSolusFormat(text);
  if (!validation.valid) {
    return NextResponse.json({ success: false, errors: [validation.error!] }, { status: 400 });
  }

  const term = validation.term!;

  // 6. Check if this user already has a processed upload for this term
  const existingUserUploadResult = await supabase
    .from("distribution_uploads")
    .select("id")
    .eq("user_id", user.id)
    .eq("term", term)
    .eq("status", "processed")
    .maybeSingle();

  if (existingUserUploadResult.error) {
    return failureResponse(
      {
        term,
        errors: ["We couldn't verify whether you've already uploaded this term. Please try again shortly."],
        reason: "dependency_failure",
      },
      503,
    );
  }

  if (existingUserUploadResult.data) {
    const duplicateAuditInsert = await supabase.from("distribution_uploads").insert({
      user_id: user.id,
      file_path: `${user.id}/${Date.now()}_${safeFileName}`,
      original_filename: file.name,
      term,
      status: "already_uploaded",
      processed_at: new Date().toISOString(),
    });

    if (duplicateAuditInsert.error) {
      console.error("[upload-distribution] failed to record duplicate upload audit row:", duplicateAuditInsert.error);
    } else {
      await redis.del(`uploads:${user.id}`);
    }

    return failureResponse(
      {
        term,
        errors: [`You have already submitted a grade distribution for ${term}. Each term can only be submitted once.`],
        reason: "already_uploaded",
      },
      400,
    );
  }

  // 7. Parse course rows
  const parsedCourses = parseCourseRows(text);
  if (parsedCourses.length === 0) {
    return NextResponse.json({ success: false, errors: ["No course data could be extracted from the PDF."] }, { status: 400 });
  }

  // 8. Look up course codes in database
  const courseCodes = parsedCourses.map((c) => c.course_code);
  const { data: matchedCourses, error: lookupError } = await supabase
    .from("courses")
    .select("id, course_code")
    .in("course_code", courseCodes);

  if (lookupError) {
    return failureResponse(
      {
        term,
        errors: ["We couldn't verify the uploaded courses right now. Please try again shortly."],
        reason: "dependency_failure",
      },
      503,
    );
  }

  const codeToId = new Map<string, string>();
  matchedCourses?.forEach((c) => codeToId.set(c.course_code, c.id));

  // Create stub courses for any codes not already in the DB
  const unmatchedRows = parsedCourses.filter((row) => !codeToId.has(row.course_code));
  const stubbedCodes: string[] = [];

  if (unmatchedRows.length > 0) {
    const stubsToInsert = unmatchedRows.map((row) => ({
      course_code: row.course_code,
      course_name: row.description,
      course_description: null,
      course_requirements: null,
      course_units: row.is_full_year_part_b ? 6 : 3,
      offering_faculty: "Unknown",
    }));

    const { error: stubUpsertError } = await supabase
      .from("courses")
      .upsert(stubsToInsert, { onConflict: "course_code", ignoreDuplicates: true });

    if (stubUpsertError) {
      console.error("[upload-distribution] stub course upsert failed:", stubUpsertError.message);
    } else {
      const unmatchedCodes = unmatchedRows.map((r) => r.course_code);
      const { data: stubIds, error: stubSelectError } = await supabase
        .from("courses")
        .select("id, course_code")
        .in("course_code", unmatchedCodes);

      if (stubSelectError) {
        console.error("[upload-distribution] stub ID fetch failed:", stubSelectError.message);
      } else {
        stubIds?.forEach((s) => {
          codeToId.set(s.course_code, s.id);
          stubbedCodes.push(s.course_code);
        });
      }
    }
  }

  // 9. Check for existing distributions for this term
  const matchedIds = Array.from(codeToId.values());
  let existingSet = new Set<string>();

  if (matchedIds.length > 0) {
    const existingDistsResult = await supabase
      .from("course_distributions")
      .select("course_id")
      .in("course_id", matchedIds)
      .eq("term", term);

    if (existingDistsResult.error) {
      return failureResponse(
        {
          term,
          errors: ["We couldn't verify existing distributions for this term. Please try again shortly."],
          reason: "dependency_failure",
        },
        503,
      );
    }

    existingSet = new Set(existingDistsResult.data?.map((d) => d.course_id) || []);
  }

  // 10. Build insert batch
  const skipped: string[] = [];
  const duplicates: string[] = [];
  const toInsert: Array<{
    course_id: string;
    term: string;
    enrollment: number;
    average_gpa: number;
    grade_counts: number[];
  }> = [];

  for (const row of parsedCourses) {
    const courseId = codeToId.get(row.course_code);
    if (!courseId) {
      skipped.push(row.course_code);
      continue;
    }
    if (existingSet.has(courseId)) {
      duplicates.push(row.course_code);
      continue;
    }
    toInsert.push({
      course_id: courseId,
      term,
      enrollment: row.enrollment,
      average_gpa: row.computed_gpa,
      grade_counts: row.grade_percentages,
    });
  }

  // 11. Insert distributions
  let inserted = 0;
  const errors: string[] = [];

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase
      .from("course_distributions")
      .insert(toInsert);

    if (insertError) {
      console.error("[upload-distribution] insert distributions failed:", insertError.message);
      errors.push("Some distributions could not be saved. Please try again shortly.");
    } else {
      inserted = toInsert.length;
    }
  }

  // 12. Record the upload
  const uploadRecordResult = await supabase.from("distribution_uploads").insert({
    user_id: user.id,
    file_path: `${user.id}/${Date.now()}_${safeFileName}`,
    original_filename: file.name,
    term,
    status: errors.length > 0 ? "rejected" : "processed",
    processed_at: new Date().toISOString(),
  });

  if (uploadRecordResult.error) {
    return failureResponse(
      {
        term,
        inserted,
        skipped,
        stubs_created: stubbedCodes,
        duplicates,
        errors: [
          inserted > 0
            ? "We processed the distribution data, but couldn't record your upload status. Please avoid retrying and contact support."
            : "We couldn't record your upload status right now. Please try again shortly."
        ],
        reason: inserted > 0 ? "partial_failure" : "dependency_failure",
      },
      503,
    );
  }

  if (errors.length > 0) {
    await redis.del(`uploads:${user.id}`);
    return failureResponse(
      {
        term,
        inserted,
        skipped,
        stubs_created: stubbedCodes,
        duplicates,
        errors: ["Some distributions could not be saved. Please try again shortly."],
        reason: "dependency_failure",
      },
      503,
    );
  }

  const response: UploadDistributionResponse = {
    success: true,
    term,
    inserted,
    skipped,
    stubs_created: stubbedCodes,
    duplicates,
    errors,
  };

  // Invalidate user-specific and affected course caches on successful upload
  const invalidations: Promise<unknown>[] = [
    redis.del(`access_status:${user.id}`),
    redis.del(`uploads:${user.id}`),
    redis.delPattern("courses:*"),
  ];
  for (const code of courseCodes) {
    invalidations.push(redis.del(`course:${code}`));
  }
  await Promise.all(invalidations);

  // Fire-and-forget: open a GitHub issue so the team knows to fetch real metadata for stub courses
  if (stubbedCodes.length > 0) {
    const titleCodes = stubbedCodes.length <= 5
      ? stubbedCodes.join(", ")
      : `${stubbedCodes.slice(0, 5).join(", ")} (+${stubbedCodes.length - 5} more)`;
    createGitHubIssue({
      title: `[Retrieve Course Info] ${titleCodes}`,
      body: `The following courses were referenced in a grade distribution upload for **${term}** but were not found in the database. Stub entries have been created automatically.\n\n${stubbedCodes.map((c) => `- ${c}`).join("\n")}`,
      labels: ["retrieve-course-info"],
    }).catch((err) => console.error("[upload-distribution] GitHub issue creation failed:", err));
  }

  return NextResponse.json(response);
}
