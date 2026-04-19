import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSafeRedirectPath } from "@/lib/auth/safe-redirect";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeRedirectPath(requestUrl.searchParams.get("next"), "/onboarding");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Auth callback: missing Supabase environment configuration");
    return NextResponse.redirect(new URL("/onboarding", requestUrl));
  }

  if (code) {
    // Build a response we can mutate to attach Set-Cookie headers
    const response = NextResponse.redirect(new URL(next, requestUrl));

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return response;
    }

    // Code exchange failed (expired or already-used link) — tell the user explicitly
    console.error("Auth callback: code exchange failed", error.message);
    return NextResponse.redirect(new URL("/sign-in?error=link_expired", requestUrl));
  }

  // No code param — someone navigated here directly
  return NextResponse.redirect(new URL("/sign-in", requestUrl));
}