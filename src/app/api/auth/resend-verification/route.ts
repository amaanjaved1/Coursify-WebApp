import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/app/api/_lib/rate-limit";

const resendVerificationSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
}).strict();

type ListedUser = {
  email?: string | null;
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
};

type AdminClient = {
  auth: {
    admin: {
      listUsers: (options: { page: number; perPage: number }) => Promise<{
        data?: { users?: ListedUser[]; total?: number | null } | null;
        error?: unknown;
      }>;
    };
  };
};

function isQueensEmail(email: string): boolean {
  return email.toLowerCase().endsWith("@queensu.ca");
}

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function getIsEmailVerified(user: ListedUser): boolean {
  return Boolean(user?.email_confirmed_at || user?.confirmed_at);
}

async function findUserByEmail(admin: AdminClient, email: string) {
  const perPage = 1000;
  let page = 1;
  while (page <= 50) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const users = data?.users ?? [];
    const match = users.find((u) => (u?.email ?? "").toLowerCase() === email);
    if (match) return match;

    const total = typeof data?.total === "number" ? data.total : null;
    if (total !== null && page * perPage >= total) break;
    if (users.length < perPage) break;
    page += 1;
  }
  return null;
}

export async function POST(request: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsedBody = resendVerificationSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const body = parsedBody.data;
  const email = normalizeEmail(body.email);

  if (!isQueensEmail(email)) {
    return NextResponse.json(
      { error: "A Queen's University (@queensu.ca) email is required." },
      { status: 400 },
    );
  }

  const ipRateLimit = await checkRateLimit({
    keyPrefix: "auth:resend-verification:ip",
    identifier: getClientIp(request),
    limit: 10,
    windowSeconds: 10 * 60,
  });
  if (!ipRateLimit.ok && ipRateLimit.reason === "dependency_failure") {
    return NextResponse.json({ error: "Verification email service is temporarily unavailable." }, { status: 503 });
  }
  if (!ipRateLimit.ok) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const emailRateLimit = await checkRateLimit({
    keyPrefix: "auth:resend-verification:email",
    identifier: email,
    limit: 3,
    windowSeconds: 10 * 60,
  });
  if (!emailRateLimit.ok && emailRateLimit.reason === "dependency_failure") {
    return NextResponse.json({ error: "Verification email service is temporarily unavailable." }, { status: 503 });
  }
  if (!emailRateLimit.ok) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Prevent user enumeration: always return success, but only actually send
  // a verification email if an unverified account exists.
  try {
    const user = await findUserByEmail(admin, email);
    if (user && !getIsEmailVerified(user)) {
      const origin = request.nextUrl.origin;
      await admin.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${origin}/auth/callback` },
      });
    }
  } catch (err) {
    console.error("[resend-verification] failed:", err);
  }

  return NextResponse.json({
    ok: true,
    message:
      "If an unverified account exists for that email, a new verification link has been sent.",
  });
}
