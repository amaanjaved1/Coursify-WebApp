"use client"

import { useState } from "react"
import { Bug, Lightbulb, MessageSquare, ExternalLink, RotateCcw, Loader2, Send } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useAuthRedirect } from "@/lib/auth/use-auth-redirect"
import { toast } from "@/components/ui/use-toast"

type IssueType = "bug" | "feature" | "feedback"

type State =
  | { phase: "idle" }
  | { phase: "submitting" }
  | { phase: "success"; issueUrl: string; issueNumber: number }
  | { phase: "error"; message: string }

const TITLE_MAX = 200
const DESC_MAX = 5000

const TITLE_PLACEHOLDERS: Record<IssueType, string> = {
  bug: "e.g. Grade chart not loading on mobile",
  feature: "e.g. Add dark mode to the course page",
  feedback: "e.g. The onboarding flow could be clearer",
}

const TEMPLATES: Record<IssueType, string> = {
  bug: ` Behaviour:
<describe what went wrong>

Steps to reproduce:
1. <first step>
2. <second step>
3. <third step>

`,
  feature: `Problem:
<describe the problem you're facing>

Proposed solution:
<describe your idea>
`,
  feedback: `<share your thoughts>
`,
}

const ISSUE_TYPES: { value: IssueType; label: string; icon: React.ReactNode }[] = [
  { value: "bug", label: "Bug Report", icon: <Bug className="h-3.5 w-3.5" /> },
  { value: "feature", label: "Feature Request", icon: <Lightbulb className="h-3.5 w-3.5" /> },
  { value: "feedback", label: "General Feedback", icon: <MessageSquare className="h-3.5 w-3.5" /> },
]

export default function IssuesPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [issueType, setIssueType] = useState<IssueType>("bug")
  const [state, setState] = useState<State>({ phase: "idle" })

  useAuthRedirect()

  const clearError = () => {
    if (state.phase === "error") setState({ phase: "idle" })
  }

  const handleIssueTypeChange = (type: IssueType) => {
    setIssueType(type)
    setDescription("")
    clearError()
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
    clearError()
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value)
    clearError()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (state.phase === "submitting") return

    const trimmedTitle = title.trim()
    const trimmedDesc = description.trim()

    if (!trimmedTitle) {
      setState({ phase: "error", message: "Please enter a title." })
      return
    }
    if (!trimmedDesc) {
      setState({ phase: "error", message: "Please enter a description." })
      return
    }

    setState({ phase: "submitting" })

    try {
      const { data: session } = await getSupabaseClient().auth.getSession()
      const token = session?.session?.access_token
      if (!token) {
        setState({ phase: "error", message: "You must be signed in to submit an issue." })
        return
      }

      const res = await fetch("/api/issues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: trimmedTitle, description: trimmedDesc, issueType }),
      })

      const data = await res.json()

      if (!res.ok) {
        const msg = data?.error ?? "Something went wrong. Please try again."
        setState({ phase: "error", message: msg })
        toast({ title: "Submission failed", description: msg, variant: "destructive" })
        return
      }

      setState({ phase: "success", issueUrl: data.issueUrl, issueNumber: data.issueNumber })
    } catch {
      const msg = "Network error. Please check your connection and try again."
      setState({ phase: "error", message: msg })
      toast({ title: "Submission failed", description: msg, variant: "destructive" })
    }
  }

  const reset = () => {
    setTitle("")
    setDescription("")
    setIssueType("bug")
    setState({ phase: "idle" })
  }

  const isSubmitting = state.phase === "submitting"

  return (
    <div className="relative min-h-screen overflow-x-clip pt-20">
      <div className="container pt-12 pb-16 px-4 md:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="relative mb-12 max-w-3xl mx-auto text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-10 top-6 h-48 w-48 rounded-full blur-[120px] opacity-80"
            style={{ background: "radial-gradient(circle, rgba(214,40,57,0.14) 0%, rgba(214,40,57,0.05) 45%, transparent 76%)" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute right-0 top-8 h-44 w-44 rounded-full blur-[120px] opacity-75"
            style={{ background: "radial-gradient(circle, rgba(0,48,95,0.12) 0%, rgba(0,48,95,0.04) 42%, transparent 74%)" }}
          />
          <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full static-glass-pill mb-4">
            <span className="text-sm font-semibold text-brand-navy dark:text-white">Issues</span>
            <MessageSquare className="h-3.5 w-3.5 shrink-0 text-brand-red" strokeWidth={2} aria-hidden />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-brand-navy dark:text-white">Report a Bug or </span>
            <span className="text-brand-red">Request a Feature</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Found a bug, have a feature idea, or want to share feedback? Submit it here and we&apos;ll
            create a public issue on our GitHub repository — that&apos;s where we track all improvements
            to Coursify as an open-source project.
          </p>
        </div>

        {/* Card */}
        <div className="max-w-xl mx-auto">
          {state.phase === "success" ? (
            <div className="static-glass-card rounded-2xl p-8 text-center">
              <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
                <Send className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-brand-navy dark:text-white mb-2">
                Issue submitted!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Issue #{state.issueNumber} has been created on GitHub. Thanks for helping improve Coursify.
              </p>
              <a
                href={state.issueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="liquid-btn-red inline-flex items-center gap-2 text-white px-6 py-2.5 rounded-xl font-medium mb-4 w-full justify-center"
              >
                View Issue #{state.issueNumber}
                <ExternalLink className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-white/50 hover:text-brand-navy dark:hover:text-white transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Submit another issue
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="static-glass-card rounded-2xl p-8 flex flex-col gap-5">
              {/* Issue Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-brand-navy dark:text-white">
                  Issue Type
                </label>
                <div className="flex gap-2 flex-wrap">
                  {ISSUE_TYPES.map(({ value, label, icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleIssueTypeChange(value)}
                      disabled={isSubmitting}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-150 disabled:opacity-50 ${
                        issueType === value
                          ? "bg-brand-red text-white border-brand-red"
                          : "border-black/[0.10] dark:border-white/[0.10] bg-white/60 dark:bg-white/[0.05] text-brand-navy dark:text-white hover:border-brand-red/50"
                      }`}
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="issue-title" className="text-sm font-medium text-brand-navy dark:text-white">
                    Title
                  </label>
                  <span className={`text-xs ${title.length > TITLE_MAX ? "text-brand-red" : "text-gray-400 dark:text-white/40"}`}>
                    {title.length}/{TITLE_MAX}
                  </span>
                </div>
                <input
                  id="issue-title"
                  type="text"
                  value={title}
                  onChange={handleTitleChange}
                  placeholder={TITLE_PLACEHOLDERS[issueType]}
                  maxLength={TITLE_MAX}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-black/[0.10] dark:border-white/[0.10] bg-white/60 dark:bg-white/[0.05] px-4 py-2.5 text-sm text-brand-navy dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-brand-navy/20 dark:focus:ring-white/20 disabled:opacity-50 transition"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="issue-description" className="text-sm font-medium text-brand-navy dark:text-white">
                    Description
                  </label>
                  <span className={`text-xs ${description.length > DESC_MAX ? "text-brand-red" : "text-gray-400 dark:text-white/40"}`}>
                    {description.length}/{DESC_MAX}
                  </span>
                </div>
                <textarea
                  id="issue-description"
                  value={description}
                  onChange={handleDescriptionChange}
                  placeholder={TEMPLATES[issueType]}
                  rows={10}
                  maxLength={DESC_MAX}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-black/[0.10] dark:border-white/[0.10] bg-white/60 dark:bg-white/[0.05] px-4 py-2.5 text-sm text-brand-navy dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-brand-navy/20 dark:focus:ring-white/20 disabled:opacity-50 resize-y transition"
                />
              </div>

              {/* Inline error */}
              {state.phase === "error" && (
                <p className="text-sm text-brand-red">{state.message}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || title.length > TITLE_MAX || description.length > DESC_MAX}
                className="liquid-btn-red inline-flex items-center justify-center gap-2 text-white px-6 py-2.5 rounded-xl font-medium disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Issue
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
