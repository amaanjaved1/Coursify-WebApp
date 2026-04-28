"use client";

import { ReactNode, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { buildAuthHref } from "@/lib/auth/safe-redirect";

type AuthRequiredProps = {
  children: ReactNode;
  /** Optional custom gate; when set, replaces the default full-page sign-in prompt */
  fallback?: ReactNode;
};

export default function AuthRequired({
  children,
  fallback,
}: AuthRequiredProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams?.toString() ?? "";

  const redirectPath = useMemo(() => {
    return search ? `${pathname}?${search}` : pathname ?? "/";
  }, [pathname, search]);

  const signInHref = useMemo(
    () => buildAuthHref("/sign-in", redirectPath),
    [redirectPath]
  );
  const signUpHref = useMemo(
    () => buildAuthHref("/sign-up", redirectPath),
    [redirectPath]
  );

  const handleClose = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] p-6 flex justify-center items-center">
        <div className="w-12 h-12 border-4 border-brand-navy/20 dark:border-blue-400/20 border-t-brand-navy dark:border-t-blue-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div
        className="glass-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <div
          className="glass-modal-panel relative max-h-[min(100vh-2rem,36rem)] w-full max-w-md overflow-y-auto rounded-[1.75rem] p-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="glass-modal-close absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full text-xl font-bold text-brand-navy/55 dark:text-white/55 hover:text-brand-red"
            onClick={handleClose}
            aria-label="Close"
          >
            &times;
          </button>

          <div className="p-6 pb-5">
            <div className="glass-modal-accent mb-5 h-1.5 w-24 rounded-full opacity-90" />
            <h2 className="text-2xl font-bold text-brand-navy dark:text-white">
              Sign in to use Queen&apos;s Answers
            </h2>
            <p className="mt-2 text-sm leading-6 text-brand-navy/70 dark:text-white/70">
              You need to sign in with your Queen&apos;s University email to use
              Queen&apos;s Answers.
            </p>
          </div>

          <div className="px-6 pb-6">
            <div className="glass-card mb-6 rounded-2xl p-4">
              <p className="text-sm leading-6 text-brand-navy/78 dark:text-white/78">
                Only Queen&apos;s University students with a valid @queensu.ca
                email address can access this feature.
              </p>
            </div>

            <p className="mb-4 text-center text-sm text-brand-navy/65 dark:text-white/60">
              New here?{" "}
              <button
                type="button"
                onClick={() => router.push(signUpHref)}
                className="font-medium text-brand-red hover:text-brand-navy dark:hover:text-white"
              >
                Create an account
              </button>
            </p>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => router.push(signInHref)}
                className="liquid-btn-red rounded-2xl px-6 py-3 text-sm font-medium text-white"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
