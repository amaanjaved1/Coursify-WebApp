"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { getSupabaseClient } from "@/lib/supabase/client";

// Pages that are always accessible regardless of onboarding status
const EXEMPT_PATHS = [
  "/onboarding",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/auth/callback",
];

type Props = { children: ReactNode };
const ACCESS_STATUS_TIMEOUT_MS = 8000;

export default function OnboardingGuard({ children }: Props) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [checking, setChecking] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  // Refs instead of state: updating these never triggers a re-render and they
  // never need to appear in the dependency array, breaking the re-run cycle.
  const checkedUserIdRef = useRef<string | null>(null);
  const redirectingRef = useRef(false);

  const userId = user?.id ?? null;
  const isExemptPath = EXEMPT_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    // Auth still resolving — wait
    if (authLoading) return;

    // No user — bail, but don't reset cached state. If the same user comes
    // back (e.g. transient auth drop during tab focus), we skip the re-check.
    if (!userId) {
      redirectingRef.current = false;
      return;
    }

    // Already on an exempt page — reset redirect flag (the redirect completed) and don't block
    if (isExemptPath) {
      redirectingRef.current = false;
      setOnboardingDone(true);
      return;
    }

    // Already confirmed for this exact user — skip re-check (tab focus, token refresh, etc.)
    if (checkedUserIdRef.current === userId) return;

    // A redirect is already in flight — don't issue another request or replace call
    if (redirectingRef.current) return;

    let cancelled = false;

    const check = async () => {
      setChecking(true);
      try {
        const { data: session } = await getSupabaseClient().auth.getSession();
        if (cancelled) return;
        const token = session?.session?.access_token;
        if (!token) {
          // No token yet — fail open but don't cache the result so the guard
          // re-checks once the session fully hydrates on the next navigation.
          setOnboardingDone(true);
          return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), ACCESS_STATUS_TIMEOUT_MS);

        const res = await fetch("/api/me/access-status", {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));

        if (cancelled) return;

        if (res.ok) {
          const data = await res.json();
          if (cancelled) return;
          if (data.needs_onboarding) {
            // Mark redirect in-flight *before* setting state so any re-run
            // triggered by setOnboardingDone(false) is immediately short-circuited.
            redirectingRef.current = true;
            setOnboardingDone(false);
            router.replace("/onboarding");
          } else {
            checkedUserIdRef.current = userId;
            setOnboardingDone(true);
          }
        } else {
          // API error — fail open but don't cache so a transient failure
          // doesn't permanently disable onboarding enforcement this session.
          setOnboardingDone(true);
        }
      } catch {
        // Fail open on network/timeout — same: don't cache so a blip doesn't
        // disable onboarding checks for the rest of the session.
        if (!cancelled) setOnboardingDone(true);
      } finally {
        if (!cancelled) setChecking(false);
      }
    };

    void check();
    return () => {
      cancelled = true;
    };
  }, [userId, authLoading, pathname, isExemptPath, router]);

  // Auth still loading — show spinner
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-navy/20 border-t-brand-navy rounded-full animate-spin" />
      </div>
    );
  }

  // User is logged in and we're actively checking (or found they need onboarding)
  if (user && !isExemptPath && (checking || onboardingDone === false)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-navy/20 border-t-brand-navy rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
