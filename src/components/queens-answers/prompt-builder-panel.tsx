"use client"

import type { RefObject } from "react"
import { useEffect, useId, useMemo, useRef, useState } from "react"
import { Hammer, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  PROMPT_BUILDER_CATEGORIES,
  PROMPT_BUILDER_DEFAULT_CATEGORY_ID,
  composePrompt,
  composePromptPreview,
} from "@/lib/queens-answers/prompt-builder-config"
import { cn } from "@/lib/utils"

export type PromptBuilderPanelProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUsePrompt: (text: string) => void
  /** Focus target after "Use prompt" (overrides default return to trigger) */
  questionInputRef?: RefObject<HTMLTextAreaElement | null>
  /** When true, composer is inert (e.g. How it works modal) */
  composerInert?: boolean
  disabled?: boolean
}

export function PromptBuilderPanel({
  open,
  onOpenChange,
  onUsePrompt,
  questionInputRef,
  composerInert = false,
  disabled = false,
}: PromptBuilderPanelProps) {
  const titleId = useId()
  const descId = useId()
  const optionDetailFieldId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closedViaUsePromptRef = useRef(false)
  const [anchorElement, setAnchorElement] = useState<Element | null>(null)

  const [categoryId, setCategoryId] = useState(PROMPT_BUILDER_DEFAULT_CATEGORY_ID)
  const [optionId, setOptionId] = useState<string | null>(null)
  const [refinementId, setRefinementId] = useState<string | null>(null)
  const [optionDetailText, setOptionDetailText] = useState("")

  const category = useMemo(
    () => PROMPT_BUILDER_CATEGORIES.find((c) => c.id === categoryId),
    [categoryId]
  )

  const selectedOption = useMemo(
    () => category?.options.find((o) => o.id === optionId),
    [category, optionId]
  )

  useEffect(() => {
    setOptionId(null)
    setRefinementId(null)
  }, [categoryId])

  useEffect(() => {
    setOptionDetailText("")
  }, [optionId])

  useEffect(() => {
    setAnchorElement(
      questionInputRef?.current?.parentElement ?? questionInputRef?.current ?? triggerRef.current
    )
  }, [open, questionInputRef])

  const composerVirtualRef = useMemo(
    () => ({
      current: anchorElement
        ? {
            getBoundingClientRect: () => anchorElement.getBoundingClientRect(),
            contextElement: anchorElement,
          }
        : null,
    }),
    [anchorElement]
  )

  const previewText = composePromptPreview(
    categoryId,
    optionId,
    refinementId,
    optionDetailText
  )
  const flatPrompt = composePrompt(categoryId, optionId, refinementId, optionDetailText)
  const canUse = Boolean(flatPrompt.trim())

  const handleUsePrompt = () => {
    if (!canUse) return
    closedViaUsePromptRef.current = true
    onUsePrompt(flatPrompt)
    onOpenChange(false)
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverAnchor virtualRef={composerVirtualRef} />
      <PopoverTrigger asChild>
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled || composerInert}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-controls={open ? "queens-answers-prompt-builder" : undefined}
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-amber-600/35 bg-[#efb215] text-[#00305f] shadow-md shadow-amber-900/10 transition-[transform,background-color,box-shadow,opacity] duration-200 ease-out",
            "hover:bg-[#f5c02a] hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#efb215]",
            "disabled:pointer-events-none disabled:opacity-35 motion-reduce:hover:scale-100 active:scale-[0.97] enabled:hover:scale-[1.04]",
            "dark:border-amber-400/40 dark:text-[#0a1628] dark:shadow-black/25"
          )}
          aria-label="Open prompt builder"
        >
          <Hammer className="h-5 w-5" strokeWidth={2.25} aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        id="queens-answers-prompt-builder"
        role="dialog"
        aria-labelledby={titleId}
        aria-describedby={descId}
        side="top"
        align="center"
        sideOffset={10}
        collisionPadding={12}
        onCloseAutoFocus={(e) => {
          e.preventDefault()
          if (closedViaUsePromptRef.current) {
            closedViaUsePromptRef.current = false
            questionInputRef?.current?.focus()
            return
          }
          triggerRef.current?.focus()
        }}
        onOpenAutoFocus={() => {
          closeRef.current?.focus()
        }}
        className={cn(
          "glass-modal-panel w-[min(calc(100vw-1rem),42rem)] max-w-[42rem] max-h-[calc(100dvh-1.5rem)] min-h-0 overflow-hidden rounded-2xl border border-white/55 p-0 shadow-xl dark:border-white/12",
          "flex flex-col gap-0 p-5 text-brand-navy dark:text-white"
        )}
        style={{
          maxHeight:
            "min(calc(100dvh - 1.5rem), var(--radix-popover-content-available-height))",
        }}
      >
        <div className="relative shrink-0 pr-10">
          <button
            ref={closeRef}
            type="button"
            className="glass-modal-close absolute right-0 top-0 flex h-9 w-9 items-center justify-center rounded-full text-brand-navy/55 dark:text-white/55 hover:text-brand-red dark:hover:text-brand-red"
            aria-label="Close prompt builder"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
          <h2 id={titleId} className="text-lg font-bold leading-tight text-brand-navy dark:text-white">
            Prompt Builder
          </h2>
          <p id={descId} className="mt-1 text-xs leading-snug text-brand-navy/70 dark:text-white/70">
            Use me to get the best responses to your questions.
          </p>
        </div>

        <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy/55 dark:text-white/55">
              Category
            </p>
            <div
              className="mt-2 flex flex-wrap gap-2"
              role="group"
              aria-label="Question categories"
            >
              {PROMPT_BUILDER_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setCategoryId(c.id)
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-left text-xs font-medium transition-colors",
                    categoryId === c.id
                      ? "border-brand-red/45 bg-brand-red/12 text-brand-navy dark:border-brand-red/50 dark:bg-brand-red/18 dark:text-white"
                      : "border-brand-navy/15 bg-white/70 text-brand-navy hover:border-brand-navy/30 dark:border-white/15 dark:bg-white/[0.06] dark:text-white/90 dark:hover:border-white/25"
                  )}
                >
                  {c.title}
                </button>
              ))}
            </div>
          </div>

          {category && (
            <>
              <div>
                <p className="text-sm font-semibold text-brand-navy dark:text-white">
                  {category.followUpQuestion}
                </p>
                <div
                  className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2"
                  role="group"
                  aria-label="Answer focus"
                >
                  {category.options.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => {
                        setOptionId(o.id)
                      }}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-left text-sm leading-snug transition-colors",
                        optionId === o.id
                          ? "border-brand-red/45 bg-brand-red/10 ring-2 ring-brand-red/20 dark:border-brand-red/45 dark:bg-brand-red/15 dark:ring-brand-red/25"
                          : "border-brand-navy/12 bg-white/60 hover:border-brand-navy/22 dark:border-white/12 dark:bg-white/[0.05] dark:hover:border-white/22"
                      )}
                    >
                      <span className="font-medium text-brand-navy dark:text-white">{o.label}</span>
                      <span className="mt-1 block text-xs leading-snug text-brand-navy/72 dark:text-white/72">
                        {o.snippet}
                      </span>
                    </button>
                  ))}
                </div>

                {selectedOption?.detailField && (
                  <div className="mt-3 max-w-full">
                    <label
                      htmlFor={optionDetailFieldId}
                      className="text-xs font-semibold text-brand-navy dark:text-white"
                    >
                      {selectedOption.detailField.label}
                    </label>
                    <Input
                      id={optionDetailFieldId}
                      type="text"
                      value={optionDetailText}
                      onChange={(e) => setOptionDetailText(e.target.value)}
                      placeholder={selectedOption.detailField.placeholder}
                      maxLength={400}
                      autoComplete="off"
                      className="mt-1.5 h-10 border-brand-navy/20 bg-white/90 text-brand-navy placeholder:text-brand-navy/45 dark:border-white/20 dark:bg-white/[0.08] dark:text-white dark:placeholder:text-white/40"
                    />
                  </div>
                )}
              </div>

              <div
                key={category.id}
                className="border-t border-brand-navy/10 pt-4 dark:border-white/10"
              >
                <p className="text-sm font-semibold text-brand-navy dark:text-white">
                  {category.refinementQuestion}
                </p>
                <p className="mt-0.5 text-xs text-brand-navy/65 dark:text-white/65">
                  Optional — narrows how the answer should be framed.
                </p>
                <div
                  className="mt-2 flex flex-wrap gap-2"
                  role="group"
                  aria-label="Refinement options"
                >
                  {category.refinementOptions.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRefinementId((prev) => (prev === r.id ? null : r.id))}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-left text-xs font-medium transition-colors",
                        refinementId === r.id
                          ? "border-brand-red/45 bg-brand-red/12 text-brand-navy dark:border-brand-red/50 dark:bg-brand-red/18 dark:text-white"
                          : "border-brand-navy/15 bg-white/70 text-brand-navy hover:border-brand-navy/30 dark:border-white/15 dark:bg-white/[0.06] dark:text-white/90 dark:hover:border-white/25"
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy/55 dark:text-white/55">
              Preview
            </p>
            <div
              className="mt-2 rounded-xl border border-brand-navy/12 bg-white/50 px-3 py-2.5 text-xs leading-relaxed text-brand-navy/85 dark:border-white/12 dark:bg-black/20 dark:text-white/80"
              aria-live="polite"
            >
              {previewText ? (
                <pre className="whitespace-pre-wrap break-words font-sans">{previewText}</pre>
              ) : (
                <span className="text-brand-navy/50 dark:text-white/45">
                  Pick a focus above to see your prompt. Refinements update the preview when selected.
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 shrink-0 border-t border-brand-navy/10 pt-4 dark:border-white/10">
          <button
            type="button"
            onClick={handleUsePrompt}
            disabled={!canUse}
            className="w-full rounded-xl bg-brand-red py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-red/25 transition hover:bg-[#c01f2e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red disabled:cursor-not-allowed disabled:opacity-40"
          >
            Use prompt
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
