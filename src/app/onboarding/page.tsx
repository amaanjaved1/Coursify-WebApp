"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { getSupabaseClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/use-toast";

const SEMESTER_OPTIONS = [
  { label: "None", sublabel: "1st sem", value: 0 },
  { label: "1", value: 1 },
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "4", value: 4 },
  { label: "5", value: 5 },
  { label: "6", value: 6 },
  { label: "7", value: 7 },
  { label: "8+", value: 8 },
];

export default function OnboardingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);

  // After email-verification the auth callback sets cookies, but the client-side
  // auth context may not have hydrated the session yet. Wait briefly before
  // redirecting unauthenticated users to /sign-in so the session has time to load.
  useEffect(() => {
    if (authLoading) return;
    if (user) return; // authenticated — nothing to do here
    // Give the Supabase client a moment to pick up the session from cookies
    const timer = setTimeout(() => {
      router.push("/sign-in");
    }, 2000);
    return () => clearTimeout(timer);
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const check = async (attempt = 0): Promise<void> => {
      try {
        const { data: session } = await getSupabaseClient().auth.getSession();
        const token = session?.session?.access_token;

        if (!token) {
          // Session may not be hydrated from cookies yet — retry a few times
          if (attempt < 3 && !cancelled) {
            await new Promise((r) => setTimeout(r, 800));
            return await check(attempt + 1);
          }
          return; // give up — page will still render the form for manual retry
        }

        if (cancelled) return;

        const res = await fetch("/api/me/access-status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && !data.needs_onboarding) router.push("/");
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    };

    void check();
    return () => { cancelled = true; };
  }, [user, router]);

  const handleSubmit = async () => {
    if (selected === null || !user) return;
    setIsSubmitting(true);
    try {
      const { data: session } = await getSupabaseClient().auth.getSession();
      const token = session?.session?.access_token;
      if (!token) throw new Error("Not authenticated");
      const res = await fetch("/api/me/academic-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ semesters_completed: selected }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save profile");
      }
      router.push("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-navy/20 border-t-brand-navy rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-12">
      {/* Card */}
      <div className="relative z-10 glass-modal-panel w-full max-w-md rounded-[1.75rem] p-7 sm:p-8">
        {/* Accent bar */}
        <div className="glass-modal-accent mx-auto mb-5 h-1.5 w-20 rounded-full opacity-90" />

        <h1 className="text-2xl sm:text-3xl font-bold text-brand-navy dark:text-white mb-1.5 tracking-tight">
          How many semesters have you completed?
        </h1>
        <p className="text-sm text-brand-navy/60 dark:text-white/55 mb-6 leading-relaxed">
          This determines how much grade data you have available to contribute.
        </p>

        <div className="grid grid-cols-3 gap-2.5 mb-6">
          {SEMESTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelected(opt.value)}
              className={`rounded-full px-4 py-3 text-sm font-semibold transition-all duration-200
                border focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/40
                ${selected === opt.value
                  ? "bg-brand-navy text-white border-brand-navy shadow-md scale-[1.03]"
                  : "bg-brand-navy/5 dark:bg-white/[0.07] border-brand-navy/15 dark:border-white/10 text-brand-navy dark:text-white hover:bg-brand-navy/10 dark:hover:bg-white/[0.12] hover:border-brand-navy/25"
                }`}
            >
              {opt.label}
              {opt.sublabel && (
                <span className={`text-[10px] ml-1 ${selected === opt.value ? "text-white/70" : "text-brand-navy/50 dark:text-white/40"}`}>
                  · {opt.sublabel}
                </span>
              )}
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={selected === null || isSubmitting}
          onClick={handleSubmit}
          className="liquid-btn-red w-full rounded-full py-3.5 font-semibold text-white text-sm disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Getting started…
            </span>
          ) : "Get Started →"}
        </button>

        <p className="mt-4 text-xs text-center text-brand-navy/40 dark:text-white/35">
          Students in their first semester are exempt from contributing.
        </p>
      </div>
    </div>
  );
}
