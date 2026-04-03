"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UploadCloud } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { AccessStatus } from "@/types";

type Props = {
  children: ReactNode;
};

export default function ContributionGate({ children }: Props) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  // null = still checking, true/false = resolved
  const [status, setStatus] = useState<AccessStatus | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    const fetchStatus = async () => {
      try {
        const { data: session } = await getSupabaseClient().auth.getSession();
        const token = session?.session?.access_token;
        if (!token) return;

        const res = await fetch("/api/me/access-status", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data: AccessStatus = await res.json();
          setStatus(data);
          if (data.needs_onboarding) {
            router.push("/onboarding");
          }
        }
      } catch {
        // on error, let through
      }
    };

    void fetchStatus();
  }, [user, authLoading, router]);

  // Always render children so page content (carousel animation etc.) mounts immediately.
  // Overlay the gate on top once we know the user doesn't have access.
  const locked = status !== null && !status.has_access && !status.needs_onboarding;

  return (
    <div className="relative">
      {/* Page content — always rendered so animations start */}
      <div
        className={locked ? "pointer-events-none select-none blur-sm opacity-40" : undefined}
        aria-hidden={locked ? true : undefined}
      >
        {children}
      </div>

      {/* Gate overlay — only shown when locked */}
      {locked && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 backdrop-blur-sm bg-black/10 dark:bg-black/30">
          <div className="glass-modal-panel w-full max-w-md rounded-[1.75rem] p-7 flex flex-col items-center text-center">
            <div className="glass-modal-accent h-1.5 w-24 rounded-full mb-5 opacity-90" />

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-navy/[0.08] dark:bg-white/[0.06] ring-1 ring-brand-navy/[0.12] dark:ring-white/10 mb-4">
              <UploadCloud className="h-7 w-7 text-brand-navy dark:text-white" strokeWidth={1.6} />
            </div>

            <h2 className="text-2xl font-bold text-brand-navy dark:text-white mb-2">
              {status?.pending_seasonal_upload
                ? `${status.due_term} Data Available`
                : "Unlock Queen\u2019s Answers"}
            </h2>

            <p className="text-sm leading-relaxed text-brand-navy/70 dark:text-white/70 mb-6 max-w-sm">
              {status?.pending_seasonal_upload
                ? `Your ${status.due_term} grade distribution is now available on SOLUS. Upload it to keep your Queen\u2019s Answers access and help your peers.`
                : `Queen\u2019s Answers is powered by community-contributed grade data. Upload your SOLUS grade distribution PDF${status && status.required_uploads > 1 ? `s (${status.upload_count}/${status.required_uploads} done)` : ""} to get access.`}
            </p>

            <Link
              href="/add-courses"
              className="liquid-btn-red inline-flex items-center justify-center rounded-2xl px-6 py-3 font-medium text-white text-sm w-full"
            >
              {status?.pending_seasonal_upload ? `Upload ${status.due_term} Data` : "Upload Distribution"}
            </Link>

            <p className="mt-4 text-xs text-brand-navy/45 dark:text-white/40">
              Already uploaded?{" "}
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="underline hover:text-brand-navy dark:hover:text-white transition-colors"
              >
                Refresh to check
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
