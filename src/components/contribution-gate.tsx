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
  const [seasonalSkipped, setSeasonalSkipped] = useState(false);

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

  const handleSkipSeasonal = () => {
    setSeasonalSkipped(true);
  };

  // Always render children so page content (carousel animation etc.) mounts immediately.
  // Overlay the gate on top once we know the user doesn't have access.
  // Seasonal gate can be skipped per-term only when the base quota is already met.
  const baseQuotaMet = status !== null && status.upload_count >= status.required_uploads;
  const locked =
    status !== null &&
    !status.has_access &&
    !status.needs_onboarding &&
    !(status.pending_seasonal_upload && seasonalSkipped && baseQuotaMet);

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
              {baseQuotaMet
                ? `${status?.due_term} Data Available`
                : "Unlock Queen\u2019s Answers"}
            </h2>

            <p className="text-sm leading-relaxed text-brand-navy/70 dark:text-white/70 mb-6 max-w-sm">
              {baseQuotaMet
                ? `Your ${status?.due_term} grade distribution is now available on SOLUS. Upload it to keep your Queen\u2019s Answers access and help your peers.`
                : `Queen\u2019s Answers requires community-contributed grade data to work. Upload your SOLUS grade distribution PDFs to get access (${status?.upload_count ?? 0}/${status?.required_uploads ?? 0} done).`}
            </p>

            <Link
              href="/add-courses"
              className="liquid-btn-red inline-flex items-center justify-center rounded-2xl px-6 py-3 font-medium text-white text-sm w-full"
            >
              {baseQuotaMet ? `Upload ${status?.due_term} Data` : "Upload Distribution"}
            </Link>

            {status?.pending_seasonal_upload && baseQuotaMet && (
              <button
                type="button"
                onClick={handleSkipSeasonal}
                className="mt-3 text-xs text-brand-navy/45 dark:text-white/40 underline hover:text-brand-navy dark:hover:text-white transition-colors"
              >
                Skip for now
              </button>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
