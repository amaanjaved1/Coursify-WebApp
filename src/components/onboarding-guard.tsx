"use client";

import { ReactNode, useEffect, useState } from "react";
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

export default function OnboardingGuard({ children }: Props) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [checking, setChecking] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  const isExemptPath = EXEMPT_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    // No user — nothing to check
    if (authLoading) return;
    if (!user) {
      setOnboardingDone(null);
      return;
    }
    // Already on an exempt page — don't block
    if (isExemptPath) {
      setOnboardingDone(true);
      return;
    }

    const check = async () => {
      setChecking(true);
      try {
        const { data: session } = await getSupabaseClient().auth.getSession();
        const token = session?.session?.access_token;
        if (!token) {
          setOnboardingDone(true); // can't check — let through
          return;
        }
        const res = await fetch("/api/me/access-status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.needs_onboarding) {
            setOnboardingDone(false);
            router.replace("/onboarding");
          } else {
            setOnboardingDone(true);
          }
        } else {
          setOnboardingDone(true); // API error — let through
        }
      } finally {
        setChecking(false);
      }
    };

    void check();
  }, [user, authLoading, pathname, isExemptPath, router]);

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
