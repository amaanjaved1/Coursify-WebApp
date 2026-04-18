"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Check, X, UploadCloud, RefreshCw, Info } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useAuthRedirect } from "@/lib/auth/use-auth-redirect";
import { getSupabaseClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/use-toast";
import type { UserProfile, AccessStatus, DistributionUploadStatus } from "@/types";

type UploadRow = {
  id: string;
  original_filename: string;
  status: DistributionUploadStatus;
  term: string | null;
  processed_at: string | null;
};

const SEMESTERS_OPTIONS = [
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

function semestersLabel(n: number): string {
  if (n === 0) return "None (1st semester)";
  if (n >= 8) return "8+ semesters";
  return `${n} semester${n === 1 ? "" : "s"}`;
}

function StatusBadge({ status }: { status: AccessStatus }) {
  if (status.is_exempt) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold px-3 py-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Exempt · First Semester
      </span>
    );
  }
  if (status.has_access) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold px-3 py-1">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        Contributor · {status.upload_count}/{status.required_uploads} uploads
      </span>
    );
  }
  // Seasonal warning — quota met but a specific term is outstanding (soft block, skippable)
  if (status.pending_seasonal_upload && status.upload_count >= status.required_uploads) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-semibold px-3 py-1">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
        Action Needed · {status.due_term} data pending
      </span>
    );
  }
  // Base quota not met (hard locked)
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold px-3 py-1">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
      Locked · {status.upload_count}/{status.required_uploads} uploads
    </span>
  );
}

function UploadStatusBadge({ status }: { status: DistributionUploadStatus }) {
  if (status === "processed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium px-2.5 py-0.5">
        <Check className="w-3 h-3" />
        Processed
      </span>
    );
  }
  if (status === "already_uploaded") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium px-2.5 py-0.5">
        <Info className="w-3 h-3" />
        Already uploaded
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium px-2.5 py-0.5">
        <X className="w-3 h-3" />
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-400 text-xs font-medium px-2.5 py-0.5">
      Pending
    </span>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
}

export default function SettingsPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [accessStatus, setAccessStatus] = useState<AccessStatus | null>(null);
  const [uploads, setUploads] = useState<UploadRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [editSemesters, setEditSemesters] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false)
  const [qaStatus, setQaStatus] = useState<{
    dailyLimit: number
    used: number
    remaining: number
  } | null>(null);

  useAuthRedirect();

  const load = async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const { data: session } = await getSupabaseClient().auth.getSession();
      const token = session?.session?.access_token;
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      const [profileRes, statusRes, uploadsRes, qaStatusRes] = await Promise.all([
        fetch("/api/me/academic-profile", { headers }),
        fetch("/api/me/access-status", { headers }),
        fetch("/api/me/uploads", { headers }),
        fetch("/api/queens-answers/status", { headers }),
      ]);

      if (profileRes.ok) {
        const { profile: p } = await profileRes.json();
        setProfile(p);
      }
      if (statusRes.ok) {
        const s = await statusRes.json();
        setAccessStatus(s);
      }
      if (uploadsRes.ok) {
        const { uploads: u } = await uploadsRes.json();
        setUploads(u ?? []);
      }
      if (qaStatusRes.ok) {
        setQaStatus(await qaStatusRes.json())
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const startEdit = () => {
    setEditSemesters(profile?.semesters_completed ?? null);
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const saveProfile = async () => {
    if (editSemesters === null) return;
    setSaving(true);
    try {
      const { data: session } = await getSupabaseClient().auth.getSession();
      const token = session?.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const res = await fetch("/api/me/academic-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ semesters_completed: editSemesters }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      const { profile: updated } = await res.json();
      setProfile(updated);
      setEditing(false);

      const statusRes = await fetch("/api/me/access-status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statusRes.ok) setAccessStatus(await statusRes.json());

      toast({ title: "Profile updated", variant: "success" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-navy/20 border-t-brand-navy rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[var(--page-bg)] pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-brand-navy dark:text-white tracking-tight">Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{user.email}</p>
        </div>

        {/* Section 1: Queen's Answers Access */}
        <div className="glass-card rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Queen&apos;s Answers Access
            </h2>
            {accessStatus ? (
              <div className="flex flex-col gap-3">
                <StatusBadge status={accessStatus} />
                {!accessStatus.needs_onboarding && (
                  <>
                    {!accessStatus.has_access && accessStatus.upload_count < accessStatus.required_uploads && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        You need {accessStatus.required_uploads - accessStatus.upload_count} more grade distribution{accessStatus.required_uploads - accessStatus.upload_count === 1 ? "" : "s"} to unlock Queen&apos;s Answers.{" "}
                        <Link href="/add-courses" className="font-medium underline hover:opacity-80">
                          Upload now →
                        </Link>
                      </p>
                    )}
                    {accessStatus.pending_seasonal_upload && accessStatus.upload_count >= accessStatus.required_uploads && (
                      <p className="text-sm text-orange-600 dark:text-orange-400">
                        Your {accessStatus.due_term} grade distribution is now available on SOLUS. Upload it to maintain your Queen&apos;s Answers access.{" "}
                        <Link href="/add-courses" className="font-medium underline hover:opacity-80">
                          Upload now →
                        </Link>
                      </p>
                    )}
                  </>
                )}
              </div>
            ) : (
              <span className="text-sm text-gray-400">Loading…</span>
            )}
        </div>

        {/* Section 2: Daily Question Limit */}
        <div className="glass-card rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Daily Question Limit
          </h2>
          {qaStatus ? (
            <div className="flex flex-col gap-3">
              <div>
                <div className="text-2xl font-bold text-brand-navy dark:text-white">
                  {qaStatus.remaining}
                  <span className="text-sm font-normal text-gray-400 dark:text-gray-500"> / {qaStatus.dailyLimit} remaining today</span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-brand-navy/10 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand-navy dark:bg-blue-400 transition-all"
                    style={{ width: `${qaStatus.dailyLimit > 0 ? Math.min(100, Math.round((qaStatus.remaining / qaStatus.dailyLimit) * 100)) : 0}%` }}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1 text-sm text-brand-navy/70 dark:text-white/65">
                <div className="flex items-center justify-between">
                  <span>0–1 semesters completed</span>
                  <span className="font-semibold text-brand-navy dark:text-white">2 questions / day</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>2–4 semesters completed</span>
                  <span className="font-semibold text-brand-navy dark:text-white">3 questions / day</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>5+ semesters completed</span>
                  <span className="font-semibold text-brand-navy dark:text-white">4 questions / day</span>
                </div>
              </div>
            </div>
          ) : (
            <span className="text-sm text-gray-400">Loading…</span>
          )}
        </div>

        {/* Section 3: Academic Profile */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Academic Profile
            </h2>
            {profile && !editing && (
              <button
                type="button"
                onClick={startEdit}
                className="flex items-center gap-1.5 text-xs text-brand-navy dark:text-white/70 hover:text-brand-red transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
            )}
          </div>

          {!profile ? (
            <div className="text-sm text-brand-navy/70 dark:text-white/70">
              Profile not set up.{" "}
              <Link href="/onboarding" className="text-brand-red hover:underline font-medium">
                Complete your profile →
              </Link>
            </div>
          ) : !editing ? (
            <div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Semesters Completed</div>
              <div className="text-sm font-semibold text-brand-navy dark:text-white">
                {semestersLabel(profile.semesters_completed)}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2.5">Semesters Completed</div>
                <div className="grid grid-cols-3 gap-2">
                  {SEMESTERS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setEditSemesters(opt.value)}
                      className={`rounded-full px-3 py-2.5 text-sm font-semibold border transition-all duration-200
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy/40
                        ${editSemesters === opt.value
                          ? "bg-brand-navy text-white border-brand-navy shadow-md scale-[1.03]"
                          : "bg-brand-navy/5 dark:bg-white/[0.07] border-brand-navy/15 dark:border-white/10 text-brand-navy dark:text-white hover:bg-brand-navy/10 dark:hover:bg-white/[0.12] hover:border-brand-navy/25"
                        }`}
                    >
                      <span>
                        {opt.label}
                        {opt.sublabel && (
                          <span className={`text-[10px] ml-1 ${editSemesters === opt.value ? "text-white/70" : "text-brand-navy/50 dark:text-white/40"}`}>
                            · {opt.sublabel}
                          </span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={editSemesters === null || saving}
                  className="liquid-btn-red rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-full px-5 py-2 text-sm font-semibold border border-brand-navy/15 dark:border-white/10 bg-brand-navy/5 dark:bg-white/[0.07] text-brand-navy dark:text-white hover:bg-brand-navy/10 dark:hover:bg-white/[0.12] transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Upload History */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Upload History
            </h2>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => void load(true)}
                disabled={refreshing}
                className="flex items-center gap-1.5 text-xs text-brand-navy dark:text-white/70 hover:text-brand-red transition-colors disabled:opacity-40"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <Link
                href="/add-courses"
                className="flex items-center gap-1.5 text-xs text-brand-navy dark:text-white/70 hover:text-brand-red transition-colors"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                Upload
              </Link>
            </div>
          </div>

          {uploads.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-brand-navy/60 dark:text-white/50 mb-3">
                No uploads yet — upload your SOLUS distribution to unlock Queen&apos;s Answers.
              </p>
              <Link
                href="/add-courses"
                className="liquid-btn-red inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-sm font-medium text-white"
              >
                <UploadCloud className="w-4 h-4" />
                Upload Distribution
              </Link>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-black/5 dark:divide-white/5">
              {uploads.map((u) => (
                <div key={u.id} className="flex items-center justify-between py-3 gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-brand-navy dark:text-white truncate">
                      {u.term ?? u.original_filename}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {u.original_filename} · {formatDate(u.processed_at)}
                    </div>
                  </div>
                  <UploadStatusBadge status={u.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
