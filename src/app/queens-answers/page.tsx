"use client"

import { Suspense } from "react"
import Link from "next/link"
import { Brain, Clock, UploadCloud } from "lucide-react"
import {
  QUEENS_ANSWERS_DISABLED_DETAIL,
  QUEENS_ANSWERS_DISABLED_ERROR,
} from "@/lib/queens-answers/availability"

function QueensAnswersSuspenseFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-[var(--page-bg)] p-6">
      <div
        className="h-12 w-12 animate-spin rounded-full border-4 border-brand-navy/20 border-t-brand-navy dark:border-blue-400/20 dark:border-t-blue-400"
        aria-label="Loading"
      />
    </div>
  )
}

function AIFeatures() {
  return (
    <main className="min-h-screen bg-[var(--page-bg)] px-4 pb-16 pt-28 sm:px-6 sm:pt-32">
      <section className="mx-auto flex min-h-[calc(100vh-11rem)] w-full max-w-3xl flex-col justify-center">
        <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-brand-navy/12 bg-white/75 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-brand-navy/65 shadow-sm dark:border-white/10 dark:bg-white/[0.07] dark:text-white/60">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          Temporarily unavailable
        </div>

        <div className="flex flex-col gap-7">
          <div>
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-red text-white shadow-lg shadow-brand-red/20">
              <Brain className="h-7 w-7" strokeWidth={1.8} aria-hidden="true" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-brand-navy dark:text-white sm:text-6xl">
              Queen&apos;s Answers
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-brand-navy/70 dark:text-white/68 sm:text-lg">
              {QUEENS_ANSWERS_DISABLED_ERROR}
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-brand-navy/55 dark:text-white/50">
              {QUEENS_ANSWERS_DISABLED_DETAIL}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/schools/queens"
              className="inline-flex items-center justify-center rounded-2xl bg-brand-navy px-5 py-3 text-sm font-semibold text-white shadow-md shadow-brand-navy/15 transition hover:bg-[#002244] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy dark:bg-white dark:text-brand-navy dark:hover:bg-white/90"
            >
              View courses
            </Link>
            <Link
              href="/add-courses"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-brand-navy/15 bg-white/70 px-5 py-3 text-sm font-semibold text-brand-navy shadow-sm transition hover:border-brand-navy/25 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy dark:border-white/10 dark:bg-white/[0.07] dark:text-white dark:hover:bg-white/[0.1]"
            >
              <UploadCloud className="h-4 w-4" aria-hidden="true" />
              Upload distribution
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

export default function QueensAnswersPage() {
  return (
    <Suspense fallback={<QueensAnswersSuspenseFallback />}>
      <AIFeatures />
    </Suspense>
  )
}
