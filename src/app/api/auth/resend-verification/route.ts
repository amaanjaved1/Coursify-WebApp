import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Body = { email?: unknown };

function isQueensEmail(email: string): boolean {
  return email.toLowerCase().endsWith("@queensu.ca");
}

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function getIsEmailVerified(user: any): boolean {
  return Boolean(user?.email_confirmed_at || user?.confirmed_at);
}

async function findUserByEmail(admin: any, email: string) {
  const perPage = 1000;
  let page = 1;
  while (page <= 50) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const users = data?.users ?? [];
    const match = users.find((u: any) => (u?.email ?? "").toLowerCase() === email);
    if (match) return match;

    const total = typeof data?.total === "number" ? data.total : null;
    if (total !== null && page * perPage >= total) break;
    if (users.length < perPage) break;
    page += 1;
  }
  return null;
}

export async function POST(request: NextRequest) {
  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawEmail = typeof body.email === "string" ? body.email : "";
  const email = normalizeEmail(rawEmail);
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  if (!isQueensEmail(email)) {
    return NextResponse.json(
      { error: "A Queen's University (@queensu.ca) email is required." },
      { status: 400 },
    );
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
