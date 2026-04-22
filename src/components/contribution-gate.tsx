"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, UploadCloud } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { AccessStatus } from "@/types";

type Props = {
  children: ReactNode;
};

export default function ContributionGate({ children }: Props) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<AccessStatus | null>(null);
  const [statusState, setStatusState] = useState<"idle" | "checking" | "ready" | "unavailable">("idle");
  const [statusError, setStatusError] = useState<string | null>(null);
  const [seasonalSkipped, setSeasonalSkipped] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setStatus(null);
      setStatusState("idle");
      setStatusError(null);
      return;
    }

    const fetchStatus = async () => {
      setStatusState("checking");
      setStatusError(null);
      try {
        const { data: session } = await getSupabaseClient().auth.getSession();
        const token = session?.session?.access_token;
        if (!token) {
          setStatus(null);
          setStatusState("unavailable");
          setStatusError("We couldn't confirm your Queen's Answers access right now.");
          return;
        }

        const res = await fetch("/api/me/access-status", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data: AccessStatus = await res.json();
          setStatus(data);
          setStatusState("ready");
          if (data.needs_onboarding) {
            router.push("/onboarding");
          }
          return;
        }
        const body = await res.json().catch(() => ({} as { error?: string }));
        setStatus(null);
        setStatusState("unavailable");
        setStatusError(body.error ?? "We couldn't confirm your Queen's Answers access right now.");
      } catch {
        setStatus(null);
        setStatusState("unavailable");
        setStatusError("We couldn't confirm your Queen's Answers access right now.");
      }
    };

    void fetchStatus();
  }, [user, authLoading, router]);

  const handleSkipSeasonal = () => setSeasonalSkipped(true);

  const baseQuotaMet = status !== null && status.upload_count >= status.required_uploads;
  const checkingAccess = !!user && statusState === "checking";
  const unavailable = !!user && statusState === "unavailable";
  const locked =
    statusState === "ready" &&
    status !== null &&
    !status.has_access &&
    !status.needs_onboarding &&
    !(status.pending_seasonal_upload && seasonalSkipped && baseQuotaMet);

  return (
    <div className="relative">
      <div
        className={locked ? "pointer-events-none select-none blur-sm opacity-40" : undefined}
        aria-hidden={locked ? true : undefined}
      >
        {children}
      </div>

      {(checkingAccess || unavailable || locked) && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 backdrop-blur-sm bg-black/10 dark:bg-black/30">
          <div className="glass-modal-panel w-full max-w-sm rounded-[1.75rem] overflow-hidden">
            {checkingAccess ? (
              <div className="px-7 py-8 flex flex-col items-center text-center">
                <div className="glass-modal-accent h-1.5 w-20 rounded-full mb-5 opacity-90" />
                <div className="w-10 h-10 border-4 border-brand-navy/20 border-t-brand-navy rounded-full animate-spin mb-4" />
                <h2 className="text-xl font-bold text-brand-navy dark:text-white mb-2">
                  Checking Queen&apos;s Answers access
                </h2>
                <p className="text-sm text-brand-navy/65 dark:text-white/60 leading-relaxed max-w-xs">
                  We&apos;re confirming your contribution status before opening Queen&apos;s Answers.
                </p>
              </div>
            ) : unavailable ? (
              <div className="px-7 py-8 flex flex-col items-center text-center">
                <div className="glass-modal-accent h-1.5 w-20 rounded-full mb-5 opacity-90" />
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 ring-1 ring-red-500/15 mb-5">
                  <AlertTriangle className="h-7 w-7 text-red-600 dark:text-red-400" strokeWidth={1.8} />
                </div>
                <h2 className="text-xl font-bold text-brand-navy dark:text-white mb-2">
                  Queen&apos;s Answers is temporarily unavailable
                </h2>
                <p className="text-sm text-brand-navy/65 dark:text-white/60 leading-relaxed max-w-xs">
                  {statusError ?? "We couldn't confirm your access right now. Please try again shortly."}
                </p>
              </div>
            ) : baseQuotaMet ? (
              <>
                {/* Congratulations section */}
                <div className="px-7 pt-8 pb-5 text-center">
                  <div className="glass-modal-accent h-1.5 w-20 rounded-full mx-auto mb-5 opacity-90" />
                  <div className="text-3xl mb-3">🎉</div>
                  <h2 className="text-xl font-bold text-brand-navy dark:text-white mb-1.5">
                    Congratulations on completing {status?.due_term}!
                  </h2>
                  <p className="text-sm text-brand-navy/60 dark:text-white/50 leading-relaxed">
                    Your semester count has been updated automatically.
                  </p>
                </div>

                {/* Divider */}
                <div className="border-t border-brand-navy/10 dark:border-white/10 mx-7" />

                {/* Upload action section */}
                <div className="px-7 pt-5 pb-8 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy/45 dark:text-white/40 mb-1">
                    One more thing
                  </p>
                  <p className="text-sm font-semibold text-brand-navy dark:text-white mb-1.5">
                    {status?.due_term} Data Available
                  </p>
                  <p className="text-sm text-brand-navy/65 dark:text-white/60 leading-relaxed mb-5">
                    Your {status?.due_term} grade distribution is now on SOLUS. Upload it to keep your access and help your peers.
                  </p>

                  <Link
                    href="/add-courses"
                    className="liquid-btn-red inline-flex items-center justify-center rounded-2xl px-6 py-3 font-medium text-white text-sm w-full"
                  >
                    Upload {status?.due_term} Data
                  </Link>

                  <div className="mt-4 flex flex-col items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSkipSeasonal}
                      className="text-xs text-brand-navy/45 dark:text-white/35 underline hover:text-brand-navy dark:hover:text-white transition-colors"
                    >
                      Skip for now
                    </button>
                    <p className="text-xs text-brand-navy/40 dark:text-white/30">
                      Semester count wrong?{" "}
                      <Link href="/settings" className="underline hover:text-brand-navy dark:hover:text-white transition-colors">
                        Fix it in Settings
                      </Link>
                    </p>
                  </div>
                </div>
              </>
            ) : (
              /* Base quota gate */
              <div className="px-7 pt-6 pb-6 flex flex-col items-center text-center">
                <div className="glass-modal-accent h-1.5 w-20 rounded-full mb-5 opacity-90" />

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-navy/[0.08] dark:bg-white/[0.06] ring-1 ring-brand-navy/[0.12] dark:ring-white/10 mb-5">
                  <UploadCloud className="h-7 w-7 text-brand-navy dark:text-white" strokeWidth={1.6} />
                </div>

                <h2 className="text-xl font-bold text-brand-navy dark:text-white mb-2">
                  Unlock Queen&apos;s Answers
                </h2>
                <p className="text-sm text-brand-navy/65 dark:text-white/60 leading-relaxed mb-6 max-w-xs">
                  Queen&apos;s Answers runs on community-contributed grade data. Upload your SOLUS grade distributions to get access.
                </p>

                <div className="w-full mb-5">
                  <div className="flex justify-between text-xs text-brand-navy/50 dark:text-white/40 mb-1.5">
                    <span>Uploads completed</span>
                    <span className="font-semibold text-brand-navy dark:text-white">
                      {status?.upload_count ?? 0} / {status?.required_uploads ?? 0}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-brand-navy/10 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-red transition-all"
                      style={{
                        width: `${status?.required_uploads ? Math.min(100, Math.round(((status.upload_count ?? 0) / status.required_uploads) * 100)) : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <Link
                  href="/add-courses"
                  className="liquid-btn-red inline-flex items-center justify-center rounded-2xl px-6 py-3 font-medium text-white text-sm w-full"
                >
                  Upload Distribution
                </Link>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
