"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { AUTH_TRANSIENT_DROP_DELAY_MS } from "@/constants/auth";

export function useAuthRedirect(redirectTo: string = "/sign-in", delayMs: number = AUTH_TRANSIENT_DROP_DELAY_MS) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    if (!user) {
      // Add a brief delay so transient auth drops (e.g., during tab focus token refresh)
      // don't cause an immediate redirect, avoiding a flicker effect.
      timeout = setTimeout(() => {
        router.push(redirectTo);
      }, delayMs);
    }
    return () => {
      if (timeout !== undefined) clearTimeout(timeout);
    };
  }, [user, authLoading, router, redirectTo, delayMs]);
}
