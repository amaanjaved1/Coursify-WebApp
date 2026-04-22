"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Info, UploadCloud, AlertTriangle, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import Image from "next/image"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { AuthModal } from "@/components/auth-modal"
import { useAuth } from "@/lib/auth/auth-context"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { UploadDistributionResponse } from "@/types"

type UploadPhase = "idle" | "uploading" | "validating" | "processing" | "done" | "duplicate" | "error"

export default function AddCoursesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>("idle")
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadResult, setUploadResult] = useState<UploadDistributionResponse | null>(null)
  const [duplicateTerm, setDuplicateTerm] = useState<string | null>(null)
  const [showSkipped, setShowSkipped] = useState(false)
  const [showDuplicates, setShowDuplicates] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()

  const handleUpload = async (file: File) => {
    if (!user) {
      setIsModalOpen(true)
      return
    }

    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      setUploadPhase("error")
      setUploadError("Please upload a PDF file.")
      return
    }

    setUploadPhase("uploading")
    setUploadError(null)
    setUploadResult(null)
    setDuplicateTerm(null)

    try {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error("Not authenticated. Please sign in again.")
      }

      const formData = new FormData()
      formData.append("file", file)

      setUploadPhase("validating")

      const response = await fetch("/api/upload-distribution", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      })

      const result: UploadDistributionResponse = await response.json()

      if (!response.ok || !result.success) {
        if (result.reason === "already_uploaded") {
          setDuplicateTerm(result.term ?? null)
          setUploadPhase("duplicate")
          return
        }
        throw new Error(result.errors?.[0] || "Upload failed.")
      }

      setUploadPhase("done")
      setUploadResult(result)
    } catch (error) {
      setUploadPhase("error")
      setUploadError(error instanceof Error ? error.message : "Upload failed. Please try again.")
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) handleUpload(e.target.files[0])
  }

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation() }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleUpload(e.dataTransfer.files[0])
  }

  const handleSelectFileClick = () => {
    if (!user) { setIsModalOpen(true); return }
    fileInputRef.current?.click()
  }

  const handleReset = () => {
    setUploadPhase("idle")
    setUploadError(null)
    setUploadResult(null)
    setDuplicateTerm(null)
    setShowSkipped(false)
    setShowDuplicates(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const phaseText: Record<string, string> = {
    uploading: "Uploading...",
    validating: "Validating PDF format...",
    processing: "Processing courses...",
  }

  return (
    <div className="relative min-h-screen overflow-hidden mesh-gradient pt-20">
      <div className="container mx-auto py-12 px-4 md:px-6 relative z-10">
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-brand-navy dark:text-white">
              Add Course <span className="coursify-gradient-text">Distributions</span>
            </h1>
            <div className="w-24 h-1 bg-brand-red mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Help improve the site and future course selections</p>
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
                      <DialogTitle className="text-xl pr-6">What is a SOLUS Distribution?</DialogTitle>
                      <DialogDescription className="text-sm leading-relaxed">
                        A SOLUS grade distribution is a report from Queen&apos;s University showing how grades were distributed across letter grades for each course you took in a given term. It looks like this:
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
                      <h3 className="text-lg font-semibold text-brand-navy dark:text-white">How to Download</h3>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-brand-navy/80 dark:text-white/70">
                        <li>Log into <strong>SOLUS Student Centre</strong></li>
                        <li>Select the <strong>Academic Records</strong> tile</li>
                        <li>Select the <strong>View Grades</strong> navigation</li>
                        <li>Select the appropriate <strong>Term/Career</strong> combination</li>
                        <li>Select the <strong>Grade Distribution</strong> button to view a grade distribution report</li>
                        <li>Download the PDF and then upload it on our website</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Main upload card */}
          <div className="glass-card rounded-3xl overflow-hidden mb-4">

            {/* Card header */}
            <div className="px-6 py-4 bg-brand-navy rounded-t-3xl">
              <h2 className="text-base font-semibold text-white">Upload SOLUS Grade Distribution</h2>
            </div>

            <div className="p-6">

              {/* ── DONE state ── */}
              {uploadPhase === "done" && uploadResult ? (
                <div className="space-y-3">
                  {/* Always show success — contribution is recorded regardless of insert count */}
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-400/10 border border-emerald-500/20 dark:border-emerald-400/15">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                        Contribution recorded!
                      </p>
                      <p className="text-xs text-emerald-700/80 dark:text-emerald-400/70 mt-0.5">
                        {uploadResult.inserted > 0
                          ? `${uploadResult.inserted} course${uploadResult.inserted !== 1 ? "s" : ""} added to the database${uploadResult.term ? ` for ${uploadResult.term}` : ""}.`
                          : `Your ${uploadResult.term || "grade"} distribution has been counted toward your contribution.`}
                      </p>
                    </div>
                    {uploadResult.term && (
                      <span className="ml-auto shrink-0 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 dark:bg-emerald-400/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-400/15">
                        {uploadResult.term} ✓
                      </span>
                    )}
                  </div>

                  {uploadResult.duplicates.length > 0 && (
                    <div className="rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 dark:border-amber-400/15 overflow-hidden">
                      <button
                        onClick={() => setShowDuplicates(!showDuplicates)}
                        className="flex items-center justify-between w-full text-left p-4"
                      >
                        <div className="flex items-center gap-3">
                          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                            {uploadResult.duplicates.length} course{uploadResult.duplicates.length !== 1 ? "s were" : " was"} already uploaded for {uploadResult.term || "this term"}
                          </p>
                        </div>
                        {showDuplicates
                          ? <ChevronUp className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                          : <ChevronDown className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />}
                      </button>
                      {showDuplicates && (
                        <div className="px-4 pb-4 pl-12 text-sm text-amber-700 dark:text-amber-400">
                          {uploadResult.duplicates.join(", ")}
                        </div>
                      )}
                    </div>
                  )}

                  {uploadResult.skipped.length > 0 && (
                    <div className="rounded-2xl bg-brand-navy/5 dark:bg-white/[0.06] border border-brand-navy/10 dark:border-white/10 overflow-hidden">
                      <button
                        onClick={() => setShowSkipped(!showSkipped)}
                        className="flex items-center justify-between w-full text-left p-4"
                      >
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-5 w-5 text-brand-navy/60 dark:text-white/50 shrink-0" />
                          <p className="text-sm font-medium text-brand-navy/80 dark:text-white/70">
                            {uploadResult.skipped.length} course{uploadResult.skipped.length !== 1 ? "s aren't" : " isn't"} in our database yet
                          </p>
                        </div>
                        {showSkipped
                          ? <ChevronUp className="h-4 w-4 text-brand-navy/50 dark:text-white/40 shrink-0" />
                          : <ChevronDown className="h-4 w-4 text-brand-navy/50 dark:text-white/40 shrink-0" />}
                      </button>
                      {showSkipped && (
                        <div className="px-4 pb-4 pl-12 text-sm text-brand-navy/60 dark:text-white/50">
                          {uploadResult.skipped.join(", ")}
                        </div>
                      )}
                    </div>
                  )}

                  {uploadResult.errors.length > 0 && (
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 dark:bg-red-400/10 border border-red-500/20 dark:border-red-400/15">
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                      <div className="text-sm text-red-700 dark:text-red-300">
                        {uploadResult.errors.map((err, i) => <p key={i}>{err}</p>)}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-center pt-2">
                    <button onClick={handleReset} className="liquid-btn-red text-white rounded-full px-6 py-2.5 text-sm font-medium">
                      Upload Another File
                    </button>
                  </div>
                </div>

              ) : uploadPhase === "duplicate" ? (
                /* ── DUPLICATE state — same term already processed ── */
                <div className="flex flex-col items-center py-4 gap-4">
                  <div className="flex items-start gap-3 w-full p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 dark:border-amber-400/15">
                    <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 text-left">
                      <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
                        Already uploaded
                      </h3>
                      <p className="text-xs text-amber-700/85 dark:text-amber-400/80 max-w-md">
                        {duplicateTerm
                          ? `You already submitted this term’s distribution (${duplicateTerm}). It’s already counted toward your contribution.`
                          : "You already submitted a distribution for this term. It’s already counted toward your contribution."}
                      </p>
                    </div>
                  </div>
                  {duplicateTerm && (
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 dark:bg-amber-400/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 dark:border-amber-400/15">
                      {duplicateTerm} · Already counted
                    </span>
                  )}
                  <button type="button" onClick={handleReset} className="liquid-btn-red text-white rounded-full px-6 py-2.5 text-sm font-medium">
                    Upload Another File
                  </button>
                </div>

              ) : (
                /* ── IDLE / UPLOADING / ERROR state ── */
                <div className="relative">
                  {(uploadPhase === "uploading" || uploadPhase === "validating" || uploadPhase === "processing") && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-10 rounded-2xl">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-brand-navy/20 border-t-brand-navy rounded-full animate-spin" />
                        <p className="text-sm font-medium text-brand-navy dark:text-white">{phaseText[uploadPhase]}</p>
                      </div>
                    </div>
                  )}

                  <div
                    className="border-2 border-dashed border-brand-navy/15 dark:border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center hover:border-brand-navy/30 dark:hover:border-white/25 transition-colors duration-300"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <div className="w-16 h-16 bg-brand-navy/[0.07] dark:bg-white/[0.06] rounded-2xl flex items-center justify-center mb-4 ring-1 ring-brand-navy/10 dark:ring-white/10">
                      <UploadCloud className="h-8 w-8 text-brand-navy dark:text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-brand-navy dark:text-white mb-2">Drop your file here</h3>
                    <p className="text-sm text-brand-navy/55 dark:text-white/50 text-center mb-6">
                      Drag and drop your SOLUS grade distribution PDF,
                      <br />or click to browse
                    </p>
                    <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
                    <button
                      onClick={handleSelectFileClick}
                      className="liquid-btn-blue text-white rounded-full px-6 py-2.5 text-sm font-medium"
                    >
                      Select PDF File
                    </button>

                    {uploadPhase === "error" && uploadError && (
                      <div className="mt-5 flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 dark:bg-red-400/10 border border-red-500/20 dark:border-red-400/15 w-full">
                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                        <p className="text-sm text-red-700 dark:text-red-300">{uploadError}</p>
                      </div>
                    )}
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
              <span className="font-semibold text-brand-navy dark:text-white">Important:</span>{" "}
              Currently, we only support on-campus courses. Online course distributions will be supported in future updates.
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
        .mesh-gradient { background: transparent; }
      `}</style>
    </div>
  )
}
