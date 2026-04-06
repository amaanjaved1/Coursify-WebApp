"use client"

import { Suspense, useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from "react"
import { createPortal } from "react-dom"
import { motion, useAnimation, AnimatePresence } from "framer-motion"
import { usePathname, useSearchParams } from "next/navigation"
import { QUEENS_ANSWERS_DRAFT_STORAGE_KEY } from "@/constants/queens-answers"
import { ArrowUp, Brain, Hammer, Search, MessageSquare, Target } from "lucide-react"
import { useMotionTier } from "@/lib/motion-prefs"
import { useAuth } from "@/lib/auth/auth-context"
import { buildAuthHref } from "@/lib/auth/safe-redirect"
import { AuthModal } from "@/components/auth-modal"
import { PromptBuilderPanel } from "@/components/queens-answers/prompt-builder-panel"
import ContributionGate from "@/components/contribution-gate"

function QueensAnswersSuspenseFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6 bg-[var(--page-bg)]">
      <div
        className="h-12 w-12 animate-spin rounded-full border-4 border-brand-navy/20 border-t-brand-navy dark:border-blue-400/20 dark:border-t-blue-400"
        aria-label="Loading"
      />
    </div>
  )
}

type ChatMessage = { role: "user" | "bot"; text: string }

// TODO: Remove artificial delay and replace with real API call when backend is ready.
// The 1.5–2.5s random timeout is purely cosmetic to simulate a realistic response time.
function mockSendMessage(_question: string): Promise<string> {
  const delay = 1500 + Math.random() * 1000 // 1.5–2.5s
  return new Promise((resolve) =>
    setTimeout(() => {
      resolve(
        "The AI is almost ready — we're putting it through its paces before course selection. For now, head over to the course explorer and upload your grade distros to get a head start!"
      )
    }, delay)
  )
}

function AIFeatures() {
  const [question, setQuestion] = useState("")
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const [promptBuilderOpen, setPromptBuilderOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isBotTyping, setIsBotTyping] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const questionTextareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesBottomRef = useRef<HTMLDivElement>(null)
  const controls = useAnimation()
  const motionTier = useMotionTier()
  const marqueeLite = motionTier === "lite"
  const { user, isLoading: authLoading } = useAuth()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const search = searchParams?.toString() ?? ""
  const redirectPath = useMemo(() => {
    return search ? `${pathname}?${search}` : pathname ?? "/queens-answers"
  }, [pathname, search])

  const signInHref = useMemo(
    () => buildAuthHref("/sign-in", redirectPath),
    [redirectPath]
  )
  const signUpHref = useMemo(
    () => buildAuthHref("/sign-up", redirectPath),
    [redirectPath]
  )

  const needsAuthToAsk = !authLoading && !user

  const adjustQuestionTextareaHeight = useCallback(() => {
    const el = questionTextareaRef.current
    if (!el) return
    el.style.height = "auto"
    const maxPx =
      typeof window !== "undefined"
        ? Math.min(360, Math.round(window.innerHeight * 0.42))
        : 360
    const next = Math.min(Math.max(el.scrollHeight, 44), maxPx)
    el.style.height = `${next}px`
  }, [])

  useLayoutEffect(() => {
    adjustQuestionTextareaHeight()
  }, [question, adjustQuestionTextareaHeight])

  useEffect(() => {
    const onResize = () => adjustQuestionTextareaHeight()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [adjustQuestionTextareaHeight])

  useEffect(() => {
    if (showHowItWorks) setPromptBuilderOpen(false)
  }, [showHowItWorks])

  useEffect(() => {
    const stored = sessionStorage.getItem(QUEENS_ANSWERS_DRAFT_STORAGE_KEY)
    if (stored) {
      setQuestion(stored)
      sessionStorage.removeItem(QUEENS_ANSWERS_DRAFT_STORAGE_KEY)
    }
  }, [])
  const howItWorksItems = [
    {
      icon: Search,
      title: "Type or tap a question",
      description: "Ask anything, or tap a suggestion from the carousel to get started.",
    },
    {
      icon: Hammer,
      title: "Use the prompt builder",
      description: "Pick a category, option, and refinement to craft a detailed question automatically.",
    },
    {
      icon: Brain,
      title: "AI generates your answer",
      description: "Your question is matched against course data, reviews, and grades to produce a tailored response.",
    },
    {
      icon: Target,
      title: "Make confident choices",
      description: "Compare courses, professors, and workloads so you can pick what fits your goals.",
    },
  ]

  // Full-page layout uses h-screen; only lock body scroll once the user can see the real page
  useEffect(() => {
    if (authLoading || !user) return
    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [authLoading, user])

  useEffect(() => {
    messagesBottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isBotTyping])

  // Sample questions with emojis
  const sampleQuestions = [
    { emoji: "📊", text: "best electives for first-years" },
    { emoji: "🧑‍🏫", text: "easiest profs for MATH 121" },
    { emoji: "💬", text: "professor reviews for PSYC 100" },
    { emoji: "📈", text: "grade distribution for BIOL 102" },
    { emoji: "🕒", text: "average workload for CHEM 112" },
    { emoji: "🏆", text: "courses with highest average" },
    { emoji: "👨‍🎓", text: "best profs for CISC 124" },
    { emoji: "🔍", text: "hidden gem electives" },
    { emoji: "🗣️", text: "prof teaching style for COMM 151" },
    { emoji: "💡", text: "tips for surviving ENGL 100" },
    { emoji: "🧑‍🤝‍🧑", text: "group project courses" },
    { emoji: "🧑‍🏫", text: "strictest graders" },
  ]

  // Duplicate the array to create a seamless loop effect
  const duplicatedQuestions = [...sampleQuestions, ...sampleQuestions, ...sampleQuestions]

  useEffect(() => {
    const startAnimation = async () => {
      await controls.start({
        x: [0, -3000],
        transition: {
          duration: 60,
          ease: "linear",
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "loop",
        },
      })
    }

    void startAnimation()

    return () => {
      controls.stop()
    }
  }, [controls])

  // Function to handle click on sample questions (just set the question text, no auth check)
  const handleSampleQuestionClick = (questionText: string) => {
    setQuestion(questionText);
  };

  // Function to actually submit a question
  const handleSubmitQuestion = async (questionText: string = question) => {
    if (needsAuthToAsk) {
      setAuthModalOpen(true)
      return
    }
    if (!questionText.trim()) return

    const userMsg: ChatMessage = { role: "user", text: questionText.trim() }
    setMessages((prev) => [...prev, userMsg])
    setQuestion("")
    setIsBotTyping(true)

    try {
      const reply = await mockSendMessage(questionText)
      setMessages((prev) => [...prev, { role: "bot", text: reply }])
    } finally {
      setIsBotTyping(false)
    }
  };

  const openAuthModalForQuestion = () => {
    if (needsAuthToAsk) setAuthModalOpen(true)
  };

  return (
      <ContributionGate>
    <div className="h-screen overflow-hidden bg-[var(--page-bg)] pt-16 sm:pt-20">
      <div className={`h-full flex flex-col items-center px-2 sm:px-4 overflow-hidden ${messages.length === 0 ? "justify-center -mt-10 sm:-mt-16" : ""}`}>
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div
              key="landing"
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
              className="w-full max-w-3xl flex flex-col items-center"
            >
              {/* Header */}
              <h1 className="text-3xl sm:text-5xl font-extrabold text-center mb-4 sm:mb-6 tracking-tight animated-title">
                <span className="gradient-text">Queen's Answers</span>
              </h1>

              {/* Continuous Carousel */}
              <div className="w-full mb-4 sm:mb-6 overflow-hidden relative carousel-container" ref={containerRef}>
                <motion.div className="flex gap-2.5 sm:gap-4 px-3 sm:px-4" animate={controls} style={{ width: "max-content" }}>
                  {duplicatedQuestions.map((q, i) => (
                    <motion.button
                      key={i}
                      type="button"
                      tabIndex={0}
                      onClick={() => {
                        handleSampleQuestionClick(q.text);
                      }}
                      className={`relative mx-0.5 flex items-center rounded-full px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-medium whitespace-nowrap box-border
                        border border-brand-navy/28 dark:border-white/[0.12]
                        ${marqueeLite ? "bg-white/95 dark:bg-zinc-800/95" : "bg-white/82 dark:bg-zinc-800/82 backdrop-blur-md"}
                        text-brand-navy dark:text-white
                        shadow-[0_2px_6px_rgba(0,48,95,0.07),0_1px_2px_rgba(0,48,95,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.28),0_1px_2px_rgba(0,0,0,0.2)]
                        transition-colors duration-[420ms] ease-in-out
                        motion-reduce:transition-none
                        hover:border-brand-navy/42 dark:hover:border-white/[0.18]
                        hover:bg-white/92 dark:hover:bg-zinc-800/90
                        hover:shadow-[0_4px_14px_rgba(0,48,95,0.1),0_2px_4px_rgba(0,48,95,0.05)] dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.38),0_2px_6px_rgba(0,0,0,0.22)]`}
                      style={{ lineHeight: "1.2" }}
                      aria-label={q.text}
                      whileHover={{
                        scale: 1.026,
                        y: -2.5,
                        zIndex: 20,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 320,
                        damping: 26,
                        mass: 0.95,
                      }}
                      whileTap={{ scale: 0.985 }}
                    >
                      <span className="mr-2 text-lg">{q.emoji}</span>
                      {q.text}
                    </motion.button>
                  ))}
                </motion.div>
              </div>

              {/* How it works link */}
              <button
                type="button"
                onClick={() => {
                  setPromptBuilderOpen(false)
                  setShowHowItWorks(true)
                }}
                className="text-brand-navy dark:text-white underline text-sm sm:text-base hover:text-brand-red transition cursor-pointer"
                style={{ background: "none", border: "none", padding: 0 }}
              >
                Learn how Queen's Answers works &gt;
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {messages.length > 0 && (
          <div className="flex-1 w-full max-w-3xl mx-auto overflow-y-auto pb-28 sm:pb-32 pt-4 px-3 sm:px-4 space-y-3 sm:space-y-4">
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5 max-w-[88%] sm:max-w-[80%] text-[14px] sm:text-[15px] bg-[#efb215] text-brand-navy dark:bg-[#efb215] dark:text-brand-navy font-medium">
                    {m.text}
                  </div>
                </div>
              ) : (
                <div key={i} className="flex justify-start gap-2 items-start">
                  <div className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-brand-red mt-0.5">
                    <Brain className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" strokeWidth={1.85} />
                  </div>
                  <div className="rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5 max-w-[88%] sm:max-w-[80%] text-[14px] sm:text-[15px] bg-brand-navy text-white dark:bg-brand-navy dark:text-white">
                    {m.text}
                  </div>
                </div>
              )
            )}
            {isBotTyping && (
              <div className="flex justify-start gap-2 items-start">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-red mt-0.5">
                  <Brain className="h-4 w-4 text-white" strokeWidth={1.85} />
                </div>
                <div className="rounded-2xl px-4 py-2.5 text-[15px] bg-brand-navy text-white">
                  <span className="typing-dots flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-white/50 animate-[dotPulse_1.4s_ease-in-out_infinite]" />
                    <span className="h-2 w-2 rounded-full bg-white/50 animate-[dotPulse_1.4s_ease-in-out_0.2s_infinite]" />
                    <span className="h-2 w-2 rounded-full bg-white/50 animate-[dotPulse_1.4s_ease-in-out_0.4s_infinite]" />
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesBottomRef} />
          </div>
        )}

        {/* Ask a Question Input at the bottom — prompt builder + composer pill */}
        <div
          className={`fixed bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 flex w-[min(100%-1rem,46rem)] sm:w-[min(100%-2rem,46rem)] max-w-3xl items-center gap-1.5 sm:gap-2 ${showHowItWorks ? "opacity-30 pointer-events-none blur-[1px]" : "opacity-100"}`}
          style={{ zIndex: 30 }}
        >
          <PromptBuilderPanel
            open={promptBuilderOpen}
            onOpenChange={(next) => {
              setPromptBuilderOpen(next)
              if (next) setShowHowItWorks(false)
            }}
            onUsePrompt={(text) => setQuestion(text)}
            questionInputRef={questionTextareaRef}
            composerInert={showHowItWorks}
            disabled={authLoading}
          />
          <div
            className={`group/composer flex min-w-0 flex-1 items-end gap-1 box-border rounded-[2rem] pl-5 pr-1.5 py-1.5
            [transition-property:background-color,border-color,box-shadow,opacity] duration-[420ms] ease-in-out
            motion-reduce:transition-none
            bg-[#fcfcfd] dark:bg-[#262626]
            border border-brand-navy/20 dark:border-white/10
            shadow-[0_2px_12px_rgba(0,48,95,0.07),0_1px_4px_rgba(0,48,95,0.045),inset_0_1px_0_rgba(255,255,255,0.92)]
            dark:shadow-[0_2px_14px_rgba(0,0,0,0.28),0_1px_4px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.06)]
            focus-within:border-brand-red/35
            ${
              showHowItWorks
                ? ""
                : "hover:border-brand-navy/28 dark:hover:border-white/[0.14] hover:shadow-[0_5px_20px_rgba(0,48,95,0.09),0_2px_6px_rgba(0,48,95,0.055),inset_0_1px_0_rgba(255,255,255,0.98)] dark:hover:shadow-[0_6px_22px_rgba(0,0,0,0.36),0_2px_8px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.08)]"
            }`}
          >
            <textarea
              ref={questionTextareaRef}
              rows={1}
              className="min-h-[44px] min-w-0 flex-1 resize-none overflow-y-auto border-0 bg-transparent py-2.5 pl-0 pr-2 text-base sm:text-[17px] leading-normal text-[#222] shadow-none outline-none ring-0 ring-offset-0 focus:border-0 focus:shadow-none focus:outline-none focus:ring-0 focus-visible:border-0 focus-visible:shadow-none focus-visible:outline-none focus-visible:ring-0 dark:text-gray-100 placeholder:text-[#8e9196] dark:placeholder:text-gray-500 placeholder:font-normal transition-colors duration-[420ms] ease-in-out motion-reduce:transition-none"
              placeholder="Ask anything"
              value={question}
              readOnly={showHowItWorks || needsAuthToAsk}
              onChange={(e) => setQuestion(e.target.value)}
              onClick={openAuthModalForQuestion}
              onFocus={(e) => {
                if (needsAuthToAsk) {
                  e.target.blur()
                  setAuthModalOpen(true)
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault()
                  if (question.trim()) handleSubmitQuestion()
                }
              }}
              disabled={showHowItWorks || authLoading}
              title="Enter for a new paragraph. Ctrl+Enter or Cmd+Enter to send."
              aria-label="Your question for Queen's Answers"
            />
            <button
              type="button"
              onClick={() => handleSubmitQuestion()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-red text-white shadow-md shadow-brand-red/25 transition-[transform,background-color,box-shadow,opacity] duration-200 ease-out hover:bg-[#c01f2e] hover:shadow-lg hover:shadow-brand-red/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red disabled:pointer-events-none disabled:opacity-35 motion-reduce:hover:scale-100 active:scale-[0.97] enabled:hover:scale-[1.04]"
              aria-label="Send question"
              disabled={showHowItWorks || authLoading || !question.trim()}
            >
              <ArrowUp
                className="h-5 w-5"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              />
            </button>
          </div>
        </div>
      </div>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {showHowItWorks && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="glass-modal-overlay modal-backdrop fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain p-3 sm:items-center sm:p-4"
                onClick={(e) => {
                  if (e.target === e.currentTarget) setShowHowItWorks(false)
                }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="glass-modal-panel relative my-auto w-full max-w-2xl rounded-[1.75rem] p-5 sm:p-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="glass-modal-close absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full text-2xl font-bold text-brand-navy/55 dark:text-white/55 hover:text-brand-red sm:right-4 sm:top-4"
                    onClick={() => setShowHowItWorks(false)}
                    aria-label="Close"
                  >
                    &times;
                  </button>
                  <div className="glass-modal-accent mx-auto mb-3 h-1.5 w-24 rounded-full opacity-90" />
                  <h2 className="mb-2 text-center text-2xl font-bold text-brand-navy dark:text-white sm:text-3xl">
                    How Queen&apos;s Answers Works
                  </h2>
                  <p className="mx-auto max-w-xl text-center text-sm leading-snug text-brand-navy/68 dark:text-white/68">
                    Ask a question, let AI do the research, and get actionable course guidance in seconds.
                  </p>
                  <ul className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
                    {howItWorksItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <li
                          key={item.title}
                          className="glass-card flex items-center gap-2.5 rounded-xl p-2.5 sm:gap-3 sm:p-3"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/55 dark:bg-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-white/70 dark:shadow-none dark:ring-white/10">
                            <Icon className="h-4 w-4 text-brand-navy dark:text-white" strokeWidth={1.85} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold leading-tight text-brand-navy dark:text-white">
                              {item.title}
                            </div>
                            <div className="mt-0.5 text-xs leading-snug text-brand-navy/70 dark:text-white/70">
                              {item.description}
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}


      {/* All styles in one place */}
      <style jsx>{`
        .carousel-container {
          position: relative;
          margin: 0 auto;
          overflow: hidden;
          padding: 12px 0;
          border-radius: 8px;
        }
        
        .animated-title {
          position: relative;
          overflow: hidden;
          padding: 0.2em 0;
        }
        
        .gradient-text {
          background: linear-gradient(
            90deg, 
            #00305f 0%, 
            #d62839 30%, 
            #efb215 60%, 
            #00305f 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-fill-color: transparent;
          animation: shine 8s linear infinite, float 3s ease-in-out infinite;
          display: inline-block;
          text-shadow: 0 0 3px rgba(0, 48, 95, 0.1);
        }
        
        :is(.dark) .gradient-text {
          background: linear-gradient(
            90deg,
            #e5e7eb 0%,
            #ff4d5e 28%,
            #ffc940 58%,
            #e5e7eb 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-fill-color: transparent;
          text-shadow: none;
        }
        
        @keyframes shine {
          to {
            background-position: 200% center;
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }
        
        .animated-title::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #d62839, transparent);
          animation: shimmer 3s infinite;
          transform: translateX(-100%);
          opacity: 0.2;
        }
        
        :is(.dark) .animated-title::before {
          background: linear-gradient(90deg, transparent, #ff4d5e, transparent);
          opacity: 0.35;
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .animate-fade-in {
          animation: fadeInModal 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .modal-backdrop {
          animation: fadeIn 0.3s ease-in-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeInModal {
          from { opacity: 0; transform: translateY(24px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes dotPulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>

    <AuthModal
      isOpen={authModalOpen}
      onClose={() => setAuthModalOpen(false)}
      title="Sign in to use Queen's Answers"
      description="You need to sign in with your Queen's University email to ask a question."
      signInHref={signInHref}
      signUpHref={signUpHref}
    />
      </ContributionGate>
  );
}

export default function QueensAnswersPage() {
  return (
    <Suspense fallback={<QueensAnswersSuspenseFallback />}>
      <AIFeatures />
    </Suspense>
  )
}
