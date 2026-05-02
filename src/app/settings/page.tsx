"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { useAuthRedirect } from "@/lib/auth/use-auth-redirect";
import { getSupabaseClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/use-toast";
import {
  QUEENS_ANSWERS_DISABLED_DETAIL,
  QUEENS_ANSWERS_DISABLED_ERROR,
} from "@/lib/queens-answers/availability";
import type { UserProfile, AccessStatus } from "@/types";
import { StatusBadge } from "./_components/status-badge";
import { UploadHistory, type UploadRow } from "./_components/upload-history";
import { SemesterEditor } from "./_components/semester-editor";

export default function SettingsPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [accessStatus, setAccessStatus] = useState<AccessStatus | null>(null);
  const [accessStatusError, setAccessStatusError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadRow[]>([]);
  const [uploadsError, setUploadsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editSemesters, setEditSemesters] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useAuthRedirect();

  const load = async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const readError = async (response: Response, fallback: string) => {
        const body = await response.json().catch(() => ({} as { error?: string; reason?: string }))
        return {
          error: typeof body.error === "string" ? body.error : fallback,
          reason: typeof body.reason === "string" ? body.reason : undefined,
        }
      }

      const { data: session } = await getSupabaseClient().auth.getSession();
      const token = session?.session?.access_token;
      if (!token) return;

      setAccessStatusError(null);
      setUploadsError(null);

      const headers = { Authorization: `Bearer ${token}` };
      const [profileRes, statusRes, uploadsRes] = await Promise.all([
        fetch("/api/me/academic-profile", { headers }),
        fetch("/api/me/access-status", { headers }),
        fetch("/api/me/uploads", { headers }),
      ]);

      if (profileRes.ok) {
        const { profile: p } = await profileRes.json();
        setProfile(p);
      }
      if (statusRes.ok) {
        setAccessStatus(await statusRes.json());
        setAccessStatusError(null);
      } else {
        const statusError = await readError(statusRes, "Unable to load access status.")
        setAccessStatus(null);
        setAccessStatusError(
          statusError.reason === "dependency_failure"
            ? "Queen's Answers access status is temporarily unavailable."
            : statusError.error
        );
      }
      if (uploadsRes.ok) {
        const { uploads: u } = await uploadsRes.json();
        setUploads(u ?? []);
        setUploadsError(null);
      } else {
        setUploads([]);
        setUploadsError("Upload history is temporarily unavailable.");
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

  const saveProfile = async () => {
    if (editSemesters === null) return;
    setSaving(true);
    try {
      const { data: session } = await getSupabaseClient().auth.getSession();
      const token = session?.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const res = await fetch("/api/me/academic-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
      if (statusRes.ok) {
        setAccessStatus(await statusRes.json());
        setAccessStatusError(null);
      } else {
        setAccessStatus(null);
        setAccessStatusError("Queen's Answers access status is temporarily unavailable.");
      }

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

        {/* Queen's Answers Access */}
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
                      <Link href="/add-courses" className="font-medium underline hover:opacity-80">Upload now →</Link>
                    </p>
                  )}
                  {accessStatus.pending_seasonal_upload && accessStatus.upload_count >= accessStatus.required_uploads && (
                    <p className="text-sm text-orange-600 dark:text-orange-400">
                      Your {accessStatus.due_term} grade distribution is now available on SOLUS. Upload it to maintain your Queen&apos;s Answers access.{" "}
                      <Link href="/add-courses" className="font-medium underline hover:opacity-80">Upload now →</Link>
                    </p>
                  )}
                </>
              )}
            </div>
          ) : accessStatusError ? (
            <p className="text-sm text-red-600 dark:text-red-400">{accessStatusError}</p>
          ) : (
            <span className="text-sm text-gray-400">Loading…</span>
          )}
        </div>

        {/* Queen's Answers Availability */}
        <div className="glass-card rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Queen&apos;s Answers Availability
          </h2>
          <div className="flex flex-col gap-2 text-sm leading-6 text-brand-navy/70 dark:text-white/65">
            <p>{QUEENS_ANSWERS_DISABLED_ERROR}</p>
            <p className="text-brand-navy/55 dark:text-white/50">{QUEENS_ANSWERS_DISABLED_DETAIL}</p>
          </div>
        </div>

        {/* Academic Profile */}
        <SemesterEditor
          profile={profile}
          editing={editing}
          editSemesters={editSemesters}
          saving={saving}
          onStartEdit={startEdit}
          onSave={saveProfile}
          onCancel={() => setEditing(false)}
          onEditSemestersChange={setEditSemesters}
        />

        {/* Upload History */}
        <UploadHistory
          uploads={uploads}
          uploadsError={uploadsError}
          refreshing={refreshing}
          onRefresh={() => void load(true)}
        />
      </div>
    </div>
  );
}
