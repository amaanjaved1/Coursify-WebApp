"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, UploadCloud } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { AccessStatus } from "@/types";

export default function SeasonalUploadBanner() {
  const { user, isLoading: authLoading } = useAuth();
  const [status, setStatus] = useState<AccessStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;

    const fetch_ = async () => {
      try {
        const { data: session } = await getSupabaseClient().auth.getSession();
        const token = session?.session?.access_token;
        if (!token) return;
        const res = await fetch("/api/me/access-status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setStatus(await res.json());
      } catch {
        // silently fail — banner is non-critical
      }
    };

    void fetch_();
  }, [user, authLoading]);

  if (!status || !status.pending_seasonal_upload || dismissed) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-between gap-3 px-4 py-3 bg-brand-navy text-white text-sm shadow-lg">
      <div className="flex items-center gap-2.5 min-w-0">
        <UploadCloud className="w-4 h-4 shrink-0 opacity-80" />
        <p className="truncate">
          <span className="font-semibold">{status.due_term}</span> grade data is now available on SOLUS —{" "}
          upload it to keep Queen&apos;s Answers access and help your peers.
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/add-courses"
          className="rounded-full bg-white/15 hover:bg-white/25 transition-colors px-3 py-1 text-xs font-semibold whitespace-nowrap"
        >
          Upload now
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
