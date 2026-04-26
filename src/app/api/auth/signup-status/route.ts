import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { redis } from "@/lib/redis";

type Body = { email?: unknown };

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function isQueensEmail(email: string): boolean {
  return email.endsWith("@queensu.ca");
}

function getClientIp(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
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
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const ip = getClientIp(request);
  const rateKey = `auth:signup_status:ip:${ip}`;
  const count = await redis.incr(rateKey);
  if (count !== null && count === 1) {
    await redis.expire(rateKey, 10 * 60);
  }
  if (count !== null && count > 30) {
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

