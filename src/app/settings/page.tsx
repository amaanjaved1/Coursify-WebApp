"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useAuthRedirect } from "@/lib/auth/use-auth-redirect";
import { getSupabaseClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/use-toast";
import {
  QUEENS_ANSWERS_DISABLED_DETAIL,
  QUEENS_ANSWERS_DISABLED_ERROR,
} from "@/lib/queens-answers/availability";
import type { UserProfile } from "@/types";
import { UploadHistory, type UploadRow } from "./_components/upload-history";
import { SemesterEditor } from "./_components/semester-editor";

export default function SettingsPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
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
      const { data: session } = await getSupabaseClient().auth.getSession();
      const token = session?.session?.access_token;
      if (!token) return;

      setUploadsError(null);

      const headers = { Authorization: `Bearer ${token}` };
      const [profileRes, uploadsRes] = await Promise.all([
        fetch("/api/me/academic-profile", { headers }),
        fetch("/api/me/uploads", { headers }),
      ]);

      if (profileRes.ok) {
        const { profile: p } = await profileRes.json();
        setProfile(p);
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
