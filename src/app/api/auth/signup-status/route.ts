import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { redis } from "@/lib/redis";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/app/api/_lib/rate-limit";

const signupStatusSchema = z.object({
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

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function isQueensEmail(email: string): boolean {
  return email.endsWith("@queensu.ca");
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

  const parsedBody = signupStatusSchema.safeParse(rawBody);
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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit({
    keyPrefix: "auth:signup-status:ip",
    identifier: ip,
    limit: 30,
    windowSeconds: 10 * 60,
  });
  if (!rateLimit.ok && rateLimit.reason === "dependency_failure") {
    return NextResponse.json({ error: "Signup status is temporarily unavailable." }, { status: 503 });
  }
  if (!rateLimit.ok) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const cacheKey = `auth:signup_status:email:${email}`;
  const cached = await redis.get<{ exists: boolean; verified: boolean }>(cacheKey);
  if (cached) {
    return NextResponse.json({ email, ...cached });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const user = await findUserByEmail(admin, email);
  const exists = Boolean(user);
  const verified = user ? getIsEmailVerified(user) : false;

  await redis.set(cacheKey, { exists, verified }, { ex: 10 * 60 });

  return NextResponse.json({ email, exists, verified });
}
