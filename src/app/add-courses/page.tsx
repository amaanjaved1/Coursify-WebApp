"use client";

import type React from "react";
import { useState, useRef } from "react";
import {
  Info,
  UploadCloud,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AuthModal } from "@/components/auth-modal";
import { useAuth } from "@/lib/auth/auth-context";
import { useAuthRedirect } from "@/lib/auth/use-auth-redirect";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { UploadDistributionResponse } from "@/types";

type FileStatus = "queued" | "uploading" | "done" | "duplicate" | "error";

type FileEntry = {
  id: string;
  file: File;
  status: FileStatus;
  result: UploadDistributionResponse | null;
  error: string | null;
  duplicateTerm: string | null;
  showDuplicates: boolean;
  showStubsCreated: boolean;
};

export default function AddCoursesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileCountError, setFileCountError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, isLoading: authLoading } = useAuth();

  useAuthRedirect("/sign-in?redirect=/add-courses");

  const queuedOrUploading = files.some(
    (f) => f.status === "queued" || f.status === "uploading",
  );
  const allDone = files.length > 0 && !queuedOrUploading;
  const doneCount = files.filter((f) => f.status === "done").length;
  const duplicateCount = files.filter((f) => f.status === "duplicate").length;
  const errorCount = files.filter((f) => f.status === "error").length;
  const queuedCount = files.filter((f) => f.status === "queued").length;

  const appendFiles = (incoming: File[]) => {
    const validFiles = incoming.filter(
      (f) => f.type === "application/pdf" || f.name.endsWith(".pdf"),
    );
    const invalidCount = incoming.length - validFiles.length;

    const oversizedFiles = validFiles.filter((f) => f.size > 5 * 1024 * 1024);
    const sizeOkFiles = validFiles.filter((f) => f.size <= 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setFileCountError(
        `${oversizedFiles.length} file${oversizedFiles.length !== 1 ? "s exceed" : " exceeds"} the 5 MB limit and was ignored.`,
      );
    }

    setFiles((prev) => {
      if (prev.length + sizeOkFiles.length > 8) {
        setFileCountError("You can upload a maximum of 8 files at a time.");
        return prev;
      }
      if (invalidCount > 0) {
        setFileCountError(
          `${invalidCount} file${invalidCount !== 1 ? "s are" : " is"} not a PDF and was ignored.`,
        );
      } else if (oversizedFiles.length === 0) {
        setFileCountError(null);
      }
      const entries: FileEntry[] = sizeOkFiles.map((f) => ({
        id: crypto.randomUUID(),
        file: f,
        status: "queued",
        result: null,
        error: null,
        duplicateTerm: null,
        showDuplicates: false,
        showStubsCreated: false,
      }));
      return [...prev, ...entries];
    });
  };

  const removeFile = (id: string) => {
    setFileCountError(null);
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const toggleShowStubsCreated = (id: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, showStubsCreated: !f.showStubsCreated } : f))
    );
  };

  const toggleShowDuplicates = (id: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, showDuplicates: !f.showDuplicates } : f,
      ),
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      appendFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      appendFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleSelectFileClick = () => {
    if (!user) {
      setIsModalOpen(true);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setFiles([]);
    setFileCountError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRetryErrors = () => {
    setFiles((prev) =>
      prev.map((f) =>
        f.status === "error" ? { ...f, status: "queued", error: null } : f,
      ),
    );
  };

  const handleUploadAll = async () => {
    if (!user) {
      setIsModalOpen(true);
      return;
    }
    setIsProcessing(true);

    const supabase = getSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setFiles((prev) =>
        prev.map((f) =>
          f.status === "queued"
            ? {
                ...f,
                status: "error",
                error: "Not authenticated. Please sign in again.",
              }
            : f,
        ),
      );
      setIsProcessing(false);
      return;
    }

    for (const entry of files) {
      if (entry.status !== "queued") continue;
      const entryId = entry.id;

      setFiles((prev) =>
        prev.map((f) => (f.id === entryId ? { ...f, status: "uploading" } : f)),
      );

      try {
        const formData = new FormData();
        formData.append("file", entry.file);

        const response = await fetch("/api/upload-distribution", {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: formData,
        });

        let result: Partial<UploadDistributionResponse> = {};
        try {
          result = await response.json();
        } catch {
          throw new Error("Server returned an unreadable response.");
        }

        if (!response.ok || !result.success) {
          if (result.reason === "already_uploaded") {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === entryId
                  ? {
                      ...f,
                      status: "duplicate",
                      duplicateTerm: result.term ?? null,
                      result: result as UploadDistributionResponse,
                    }
                  : f,
              ),
            );
            continue;
          }
          throw new Error(result.errors?.[0] || "Upload failed.");
        }

        setFiles((prev) =>
          prev.map((f) =>
            f.id === entryId
              ? {
                  ...f,
                  status: "done",
                  result: result as UploadDistributionResponse,
                }
              : f,
          ),
        );
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === entryId
              ? {
                  ...f,
                  status: "error",
                  error:
                    error instanceof Error
                      ? error.message
                      : "Upload failed. Please try again.",
                }
              : f,
          ),
        );
      }
    }

    setIsProcessing(false);
  };

  const CircularStatus = ({ status }: { status: FileStatus }) => {
    if (status === "uploading") {
      return (
        <span className="shrink-0 w-5 h-5 border-2 border-brand-navy/20 dark:border-white/20 border-t-brand-navy dark:border-t-white rounded-full animate-spin" />
      );
    }
    if (status === "done") {
      return (
        <svg
          className="shrink-0 w-5 h-5 text-emerald-500 dark:text-emerald-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <circle cx="10" cy="10" r="10" />
          <path
            fill="white"
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    if (status === "duplicate") {
      return (
        <svg
          className="shrink-0 w-5 h-5 text-amber-400 dark:text-amber-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <circle cx="10" cy="10" r="10" />
          <path
            fill="white"
            fillRule="evenodd"
            d="M10 9a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm0-4a1 1 0 110 2 1 1 0 010-2z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    if (status === "error") {
      return (
        <svg
          className="shrink-0 w-5 h-5 text-red-500 dark:text-red-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <circle cx="10" cy="10" r="10" />
          <path
            fill="white"
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    return (
      <svg
        className="shrink-0 w-5 h-5 text-brand-navy/20 dark:text-white/20"
        viewBox="0 0 20 20"
        fill="none"
      >
        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-navy/20 border-t-brand-navy rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div
          className="w-10 h-10 border-4 border-brand-navy/20 border-t-brand-navy rounded-full animate-spin"
          aria-hidden="true"
        />
        <p
          className="text-sm text-gray-600 dark:text-gray-400"
          role="status"
          aria-live="polite"
        >
          Redirecting to sign in...
        </p>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden mesh-gradient pt-20"
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div className="container mx-auto py-12 px-4 md:px-6 relative z-10">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-brand-navy dark:text-white">
              Add Course{" "}
              <span className="coursify-gradient-text">Distributions</span>
            </h1>
            <div className="w-24 h-1 bg-brand-red mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Help improve the site and future course selections
            </p>
            <p className="mt-2 text-sm text-brand-navy/60 dark:text-white/50">
              You can select and upload multiple term distributions at once
            </p>
          </div>

          {/* How to find SOLUS link */}
          <div className="flex justify-center mb-6">
            <Dialog>
              <DialogTrigger asChild>
                <button className="liquid-btn-red text-white px-6 py-2.5 rounded-full inline-flex items-center gap-2 font-medium text-sm">
                  <Info className="h-4 w-4" />
                  How To Find SOLUS Distribution
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-xl p-0 block overflow-hidden">
                <div className="max-h-[85vh] overflow-y-auto w-full">
                  <div className="p-6 flex flex-col gap-4">
                    <DialogHeader>
                      <DialogTitle className="text-xl pr-6">
                        What is a SOLUS Distribution?
                      </DialogTitle>
                      <DialogDescription className="text-sm leading-relaxed">
                        A SOLUS grade distribution is a report from Queen&apos;s
                        University showing how grades were distributed across
                        letter grades for each course you took in a given term.
                        It looks like this:
                      </DialogDescription>
                    </DialogHeader>
                    <Image
                      src="/course-distribution-example.png"
                      alt="Example of a SOLUS grade distribution report"
                      width={600}
                      height={300}
                      className="rounded-xl border border-brand-navy/10 dark:border-white/10 w-full shrink-0"
                    />
                    <div className="space-y-3 shrink-0">
                      <h3 className="text-lg font-semibold text-brand-navy dark:text-white">
                        How to Download
                      </h3>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-brand-navy/80 dark:text-white/70">
                        <li>
                          Log into <strong>SOLUS Student Centre</strong>
                        </li>
                        <li>
                          Select the <strong>Academic Records</strong> tile
                        </li>
                        <li>
                          Select the <strong>View Grades</strong> navigation
                        </li>
                        <li>
                          Select the appropriate <strong>Term/Career</strong>{" "}
                          combination
                        </li>
                        <li>
                          Select the <strong>Grade Distribution</strong> button
                          to view a grade distribution report
                        </li>
                        <li>
                          Download the PDF and then upload it on our website
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Main upload card */}
          <div className="glass-card rounded-3xl overflow-hidden mb-4">
            <div className="px-6 py-4 bg-brand-navy rounded-t-3xl">
              <h2 className="text-base font-semibold text-white">
                Upload SOLUS Grade Distribution
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {/* ── Dropzone (hidden while processing) ── */}
              {!isProcessing && (
                <div
                  className="border-2 border-dashed border-brand-navy/15 dark:border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center hover:border-brand-navy/30 dark:hover:border-white/25 transition-colors duration-300"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <div className="w-16 h-16 bg-brand-navy/[0.07] dark:bg-white/[0.06] rounded-2xl flex items-center justify-center mb-4 ring-1 ring-brand-navy/10 dark:ring-white/10">
                    <UploadCloud className="h-8 w-8 text-brand-navy dark:text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-brand-navy dark:text-white mb-2">
                    {files.length === 0
                      ? "Drop your files here"
                      : "Drop more files"}
                  </h3>
                  <p className="text-sm text-brand-navy/55 dark:text-white/50 text-center mb-6">
                    Drag and drop your SOLUS grade distribution PDFs,
                    <br />
                    or click to browse (up to 8 files)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    onClick={handleSelectFileClick}
                    className="liquid-btn-blue text-white rounded-full px-6 py-2.5 text-sm font-medium"
                  >
                    Select PDF Files
                  </button>

                  {fileCountError && (
                    <div className="mt-5 flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 dark:bg-red-400/10 border border-red-500/20 dark:border-red-400/15 w-full">
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {fileCountError}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── File queue list ── */}
              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-2xl border border-brand-navy/10 dark:border-white/10 overflow-hidden"
                    >
                      {/* File row header */}
                      <div className="flex items-center gap-3 px-4 py-3 bg-brand-navy/[0.03] dark:bg-white/[0.03]">
                        {entry.status === "queued" && (
                          <span className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-navy/10 dark:bg-white/10 text-brand-navy/70 dark:text-white/60">
                            Queued
                          </span>
                        )}
                        {entry.status === "uploading" && (
                          <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-navy/10 dark:bg-white/10 text-brand-navy dark:text-white">
                            <span className="w-2.5 h-2.5 border-2 border-brand-navy/30 dark:border-white/30 border-t-brand-navy dark:border-t-white rounded-full animate-spin" />
                            Uploading
                          </span>
                        )}
                        {entry.status === "done" && (
                          <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 dark:bg-emerald-400/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-400/15">
                            <CheckCircle2 className="h-3 w-3" />
                            Done
                          </span>
                        )}
                        {entry.status === "duplicate" && (
                          <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 dark:bg-amber-400/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 dark:border-amber-400/15">
                            <AlertCircle className="h-3 w-3" />
                            Already uploaded
                          </span>
                        )}
                        {entry.status === "error" && (
                          <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/15 dark:bg-red-400/10 text-red-700 dark:text-red-400 border border-red-500/20 dark:border-red-400/15">
                            <AlertTriangle className="h-3 w-3" />
                            Error
                          </span>
                        )}

                        <span className="text-sm text-brand-navy dark:text-white truncate flex-1 min-w-0">
                          {entry.file.name}
                        </span>

                        <CircularStatus status={entry.status} />

                        {!isProcessing && entry.status !== "uploading" && (
                          <button
                            onClick={() => removeFile(entry.id)}
                            className="shrink-0 text-brand-navy/40 dark:text-white/30 hover:text-brand-red dark:hover:text-brand-red transition-colors ml-1"
                            aria-label="Remove file"
                          >
                            <svg
                              className="h-4 w-4"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Per-file result details */}
                      {entry.status === "done" && entry.result && (
                        <div className="px-4 py-3 space-y-2 border-t border-brand-navy/8 dark:border-white/8">
                          <p className="text-xs text-emerald-700 dark:text-emerald-400">
                            {entry.result.inserted > 0
                              ? `${entry.result.inserted} course${entry.result.inserted !== 1 ? "s" : ""} added${entry.result.term ? ` for ${entry.result.term}` : ""}.`
                              : `Distribution counted toward your contribution${entry.result.term ? ` (${entry.result.term})` : ""}.`}
                          </p>

                          {entry.result.duplicates.length > 0 && (
                            <div className="rounded-xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 dark:border-amber-400/15 overflow-hidden">
                              <button
                                onClick={() => toggleShowDuplicates(entry.id)}
                                className="flex items-center justify-between w-full text-left px-3 py-2"
                              >
                                <span className="text-xs font-medium text-amber-800 dark:text-amber-300">
                                  {entry.result.duplicates.length} course
                                  {entry.result.duplicates.length !== 1
                                    ? "s"
                                    : ""}{" "}
                                  already in DB
                                </span>
                                {entry.showDuplicates ? (
                                  <ChevronUp className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                )}
                              </button>
                              {entry.showDuplicates && (
                                <div className="px-3 pb-2 text-xs text-amber-700 dark:text-amber-400">
                                  {entry.result.duplicates.join(", ")}
                                </div>
                              )}
                            </div>
                          )}

                          {entry.result.stubs_created.length > 0 && (
                            <div className="rounded-xl bg-brand-navy/5 dark:bg-white/[0.06] border border-brand-navy/10 dark:border-white/10 overflow-hidden">
                              <button
                                onClick={() => toggleShowStubsCreated(entry.id)}
                                className="flex items-center justify-between w-full text-left px-3 py-2"
                              >
                                <span className="text-xs font-medium text-brand-navy/80 dark:text-white/70">
                                  {entry.result.stubs_created.length} new course
                                  {entry.result.stubs_created.length !== 1 ? "s" : ""}{" "}
                                  added to the database (grade data captured, details pending)
                                </span>
                                {entry.showStubsCreated ? (
                                  <ChevronUp className="h-3.5 w-3.5 text-brand-navy/50 dark:text-white/40 shrink-0" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5 text-brand-navy/50 dark:text-white/40 shrink-0" />
                                )}
                              </button>
                              {entry.showStubsCreated && (
                                <div className="px-3 pb-2 text-xs text-brand-navy/60 dark:text-white/50">
                                  {entry.result.stubs_created.join(", ")}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {entry.status === "duplicate" && (
                        <div className="px-4 py-3 border-t border-brand-navy/8 dark:border-white/8">
                          <p className="text-xs text-amber-700/85 dark:text-amber-400/80">
                            {entry.duplicateTerm
                              ? `You already submitted this term's distribution (${entry.duplicateTerm}). It's already counted toward your contribution.`
                              : "You already submitted a distribution for this term. It's already counted toward your contribution."}
                          </p>
                        </div>
                      )}

                      {entry.status === "error" && entry.error && (
                        <div className="px-4 py-3 border-t border-brand-navy/8 dark:border-white/8">
                          <p className="text-xs text-red-700 dark:text-red-300">
                            {entry.error}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ── Upload button ── */}
              {files.length > 0 && !isProcessing && !allDone && (
                <div className="flex justify-center pt-1">
                  <button
                    onClick={handleUploadAll}
                    className="liquid-btn-gold text-white rounded-full px-6 py-2.5 text-sm font-medium"
                  >
                    Begin Upload
                  </button>
                </div>
              )}

              {/* ── Processing spinner label ── */}
              {isProcessing && (
                <div className="flex items-center justify-center gap-2 py-2">
                  <div className="w-4 h-4 border-2 border-brand-navy/20 border-t-brand-navy dark:border-white/20 dark:border-t-white rounded-full animate-spin" />
                  <span className="text-sm text-brand-navy/70 dark:text-white/60">
                    Processing...
                  </span>
                </div>
              )}

              {/* ── Batch summary + reset ── */}
              {allDone && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-center gap-3 py-2 text-sm">
                    {doneCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        {doneCount} uploaded
                      </span>
                    )}
                    {duplicateCount > 0 && (
                      <span className="text-amber-700 dark:text-amber-400 font-medium">
                        {duplicateCount} duplicate
                        {duplicateCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    {errorCount > 0 && (
                      <span className="text-red-700 dark:text-red-400 font-medium">
                        {errorCount} error{errorCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-center gap-3">
                    {errorCount > 0 && (
                      <button
                        onClick={handleRetryErrors}
                        className="liquid-btn-blue text-white rounded-full px-6 py-2.5 text-sm font-medium"
                      >
                        Retry {errorCount} failed
                      </button>
                    )}
                    <button
                      onClick={handleReset}
                      className="liquid-btn-red text-white rounded-full px-6 py-2.5 text-sm font-medium"
                    >
                      Upload More Files
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Important notice */}
          <div className="glass-card rounded-2xl p-4 flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 dark:bg-amber-400/10 ring-1 ring-amber-500/20 dark:ring-amber-400/15">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-sm leading-relaxed text-brand-navy/75 dark:text-white/65 pt-0.5">
              <span className="font-semibold text-brand-navy dark:text-white">
                Important:
              </span>{" "}
              Currently, we only support on-campus courses. Online course
              distributions will be supported in future updates.
            </p>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Sign in to upload distributions"
        description="You need to sign in with your Queen's University email to upload course distributions."
      />

      <style jsx global>{`
        .mesh-gradient {
          background: transparent;
        }
      `}</style>
    </div>
  );
}
