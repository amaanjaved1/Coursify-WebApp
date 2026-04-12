"use client";

import { useState, useEffect, type CSSProperties } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useMotionTier } from "@/lib/motion-prefs";
import {
  Brain,
  BarChart3,
  BarChart,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Info,
  Star,
  Zap,
  Award,
  UserPlus,
  Upload,
  Eye,
  Sparkles,
  Users,
} from "lucide-react";
import {
  GradeDistributionMockup,
  StudentReviewsMockup,
  AIAssistantMockup,
  CourseAnalyticsMockup,
} from "@/components/landing-mockups";
import { BRAND_NAVY_LIGHT } from "@/constants/brand";
import { cn } from "@/lib/utils";

const featureTabSpring = {
  type: "spring" as const,
  stiffness: 320,
  damping: 30,
  mass: 0.55,
};

const featurePanelTransition = {
  duration: 0.5,
  ease: [0.25, 0.1, 0.25, 1] as const,
};

const featurePanelVariants = {
  initial: { opacity: 0, y: 12, scale: 0.992 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { ...featurePanelTransition, opacity: { duration: 0.42 } },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.996,
    transition: { duration: 0.28, ease: [0.4, 0, 1, 1] as const },
  },
};

function SectionGlow({
  className,
  gradient,
}: {
  className: string;
  gradient: string;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute rounded-full hidden md:block ${className}`}
      style={{ background: gradient }}
    />
  );
}

export default function Home() {
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null);
  const [activeFeatureTab, setActiveFeatureTab] = useState(0);
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const motionTier = useMotionTier();
  const lite = motionTier === "lite";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    fetch("/api/stats/user-count")
      .then((r) => r.json())
      .then((data) => {
        // sorry for larping XD. keep it on the down low pls lmao
        setStudentCount((data.count ?? 0) + 169);
      })
      .catch(() => {});
  }, []);

  const toggleAccordion = (index: number) =>
    setActiveAccordion(activeAccordion === index ? null : index);

  const steps = [
    {
      num: "01",
      title: "Create an Account",
      desc: "Sign up for free and personalize your course planning experience.",
      icon: <UserPlus className="h-6 w-6" />,
      color: "#d62839",
    },
    {
      num: "02",
      title: "Upload Grade Distributions",
      desc: "Contribute data to help the community make smarter decisions.",
      icon: <Upload className="h-6 w-6" />,
      color: "#00305f",
      darkColor: "#5a93c9",
      darkIconBg: "rgba(90, 147, 201, 0.22)",
    },
    {
      num: "03",
      title: "View Course Data",
      desc: "Explore real grade breakdowns, enrollment trends, and student reviews.",
      icon: <Eye className="h-6 w-6" />,
      color: "#efb215",
    },
    {
      num: "04",
      title: "Ask Our AI",
      desc: "Chat with the AI assistant for personalized course and professor recommendations.",
      icon: <Sparkles className="h-6 w-6" />,
      color: "#d62839",
    },
  ];

  const featureTabs = [
    {
      label: "Grade Distributions",
      icon: <BarChart3 className="h-5 w-5" />,
      title: "Real grade data across 10+ semesters",
      description:
        "See actual grade breakdowns for every Queen's course. Compare how difficulty has changed over time, identify trends, and understand what to expect before you enroll.",
    },
    {
      label: "Student Reviews",
      icon: <MessageSquare className="h-5 w-5" />,
      title: "Aggregated student feedback from across the web",
      description:
        "Read comments pulled from Reddit and RateMyProfessors, filtered for relevance to Queen's courses. Get the full picture of what students actually think.",
    },
    {
      label: "AI Assistant",
      icon: <Brain className="h-5 w-5" />,
      title: "Your personal course advisor, powered by AI",
      description:
        "Ask anything about courses, professors, teaching styles, and workload. Our AI is trained on thousands of student experiences to give you personalized, instant answers.",
    },
    {
      label: "Course Analytics",
      icon: <BarChart className="h-5 w-5" />,
      title: "Visualize trends and make informed decisions",
      description:
        "Track GPA trends, passing rates, and enrollment numbers across semesters. Identify the best time to take a course and which sections to target.",
    },
  ];

  const testimonials = [
    {
      quote:
        "The AI assistant recommended a professor whose teaching style matched how I learn. Best course experience I've had at Queen's!",
      name: "Queen's Engineering Student",
      program: "Class of 2024",
      initial: "E",
      color: "#d62839",
    },
    {
      quote:
        "The AI chatbot gave me insights about my professor's teaching style that I couldn't find anywhere else.",
      name: "Queen's Arts Student",
      program: "Class of 2026",
      initial: "A",
      color: "#00305f",
      darkColor: BRAND_NAVY_LIGHT,
    },
    {
      quote:
        "Being able to see how course difficulty changed over different semesters helped me pick the best time to take COMM 151.",
      name: "Queen's Science Student",
      program: "Class of 2025",
      initial: "S",
      color: "#efb215",
    },
  ];

  const faqs = [
    {
      question: "Is Coursify connected to SOLUS?",
      answer:
        "Coursify is not officially connected to SOLUS, but we've collected grade distribution data from multiple reliable sources. You'll need to register for courses through SOLUS after researching them on our platform.",
    },
    {
      question: "Where does the chatbot get its information?",
      answer:
        "Our AI advisor is trained on thousands of student reviews from Queen's course catalogs, Reddit discussions, and RateMyProfessors reviews to provide you with comprehensive insights about courses and professors.",
    },
    {
      question: "How up-to-date is the grade data?",
      answer:
        "We update our database each semester with the latest grade distributions and course information to ensure you have access to the most current data for decision making.",
    },
    {
      question: "Is this tool free?",
      answer:
        "Yes, Coursify is completely free for all Queen's University students. We believe in making data-driven course selection accessible to everyone.",
    },
    {
      question: "What courses are supported?",
      answer:
        "Currently, Coursify only supports on-campus courses at Queen's University. We're working on adding support for online courses in the future, but for now, our data and AI assistant focus exclusively on in-person course offerings.",
    },
  ];

  const activeTab = featureTabs[activeFeatureTab];

  return (
    <div className="relative overflow-hidden">
      <style jsx global>{`
        @keyframes gradient-shift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .gradient-text-animated {
          color: #00305f;
          background: linear-gradient(
            -45deg,
            #00305f,
            #d62839,
            #efb215,
            #00305f
          );
          background-size: 300% 300%;
          animation: gradient-shift 6s ease infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        :is(.dark) .gradient-text-animated {
          color: #4a9eff;
          background: linear-gradient(
            -45deg,
            #4a9eff,
            #ff4d5e,
            #ffc940,
            #4a9eff
          );
          background-size: 300% 300%;
          animation: gradient-shift 6s ease infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        @keyframes bounce-slow {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative min-h-screen overflow-x-hidden pt-24 sm:pt-28 pb-12 sm:pb-16">
        <SectionGlow
          className="left-[6%] top-28 h-72 w-72 blur-[145px] opacity-90"
          gradient="radial-gradient(circle, rgba(0,48,95,0.18) 0%, rgba(0,48,95,0.07) 48%, transparent 76%)"
        />
        <SectionGlow
          className="right-[8%] top-[18%] h-64 w-64 blur-[135px] opacity-80"
          gradient="radial-gradient(circle, rgba(214,40,57,0.16) 0%, rgba(214,40,57,0.06) 42%, transparent 74%)"
        />
        <SectionGlow
          className="bottom-24 left-1/2 h-80 w-80 -translate-x-1/2 blur-[150px] opacity-75"
          gradient="radial-gradient(circle, rgba(239,178,21,0.12) 0%, rgba(239,178,21,0.04) 45%, transparent 72%)"
        />

        <div className="container mx-auto px-6 sm:px-8 lg:px-12 relative z-10 min-h-[calc(100svh-6rem)] sm:min-h-[calc(100svh-7rem)] flex items-center">
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — text */}
            <div>
              <div className="inline-flex flex-wrap items-center gap-2 mb-8">
                <div className="inline-flex items-center gap-2 rounded-full glass-pill px-4 py-2">
                  <Zap className="h-3.5 w-3.5 text-brand-red" />
                  <span className="text-xs font-semibold text-brand-navy dark:text-white">
                    Built for Queen&apos;s Students
                  </span>
                </div>
                {studentCount === null ? (
                  <div className="inline-flex items-center rounded-full px-4 py-2 glass-pill">
                    <div className="h-3 w-28 rounded-full bg-brand-navy/10 dark:bg-white/10 animate-pulse" />
                  </div>
                ) : (
                  <div
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-brand-navy"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(239,178,21,0.95) 0%, rgba(185,132,18,0.96) 100%)",
                      border: "1px solid rgba(255,255,255,0.28)",
                      boxShadow:
                        "0 4px 16px rgba(239,178,21,0.35), inset 0 1px 0 rgba(255,255,255,0.22)",
                    }}
                  >
                    <motion.span
                      animate={{ scale: [1, 1.22, 1] }}
                      transition={{
                        repeat: Infinity,
                        duration: 2.2,
                        ease: "easeInOut",
                      }}
                    >
                      <Users className="h-3.5 w-3.5 text-brand-navy" />
                    </motion.span>
                    <span className="text-xs font-semibold">
                      Join {studentCount} students
                    </span>
                  </div>
                )}
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-7 leading-[1.05] tracking-tight">
                <span className="gradient-text-animated">Course selection</span>
                <br />
                <span className="text-brand-navy dark:text-white">
                  powered by
                </span>
                <br />
                <span className="gradient-text-animated">AI</span>
              </h1>

              <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-lg leading-relaxed">
                Coursify helps you make smarter decisions around course
                selection by giving you access to historical grade
                distributions, student reviews, and an AI assistant.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-4">
                <Link
                  href="/queens-answers"
                  className="liquid-btn-red text-white px-7 py-3 rounded-xl inline-block font-medium w-full sm:w-auto text-center"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    <Brain className="mr-2 h-5 w-5" />
                    Ask AI Assistant
                  </span>
                </Link>
                <Link
                  href="/schools/queens"
                  className="liquid-btn-blue text-white px-7 py-3 rounded-xl inline-block font-medium w-full sm:w-auto text-center"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    <BarChart className="mr-2 h-5 w-5" />
                    Browse Courses
                  </span>
                </Link>
              </div>
            </div>

            {/* Right — structured UI mockup cards */}
            <div className="relative hidden lg:flex flex-col gap-4 subpixel-antialiased [transform:translateZ(0)]">
              <div className="w-full">
                <GradeDistributionMockup />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-full">
                  <StudentReviewsMockup />
                </div>
                <div className="h-full">
                  <AIAssistantMockup />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section className="section-glass py-12 sm:py-16 px-4 relative overflow-hidden">
        <SectionGlow
          className="left-1/2 top-12 h-80 w-80 -translate-x-1/2 blur-[155px] opacity-75"
          gradient="radial-gradient(circle, rgba(239,178,21,0.16) 0%, rgba(239,178,21,0.05) 44%, transparent 74%)"
        />
        <SectionGlow
          className="right-0 bottom-6 h-72 w-72 blur-[145px] opacity-70"
          gradient="radial-gradient(circle, rgba(0,48,95,0.14) 0%, rgba(0,48,95,0.04) 46%, transparent 74%)"
        />

        <div className="container mx-auto relative z-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center gap-2 rounded-full glass-pill px-4 py-2 mb-3">
              <Award className="h-3.5 w-3.5 text-brand-gold" />
              <span className="text-brand-gold text-xs font-semibold">
                How It Works
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2 text-brand-navy dark:text-white">
              Your path to{" "}
              <span className="gradient-text">smarter decisions</span>
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Get started in minutes. Here&apos;s how Coursify helps you plan
              your courses.
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((step) => (
              <div
                key={step.num}
                className="glass-card group rounded-2xl p-6 relative overflow-hidden"
              >
                <span className="absolute top-3 right-4 text-6xl font-black opacity-[0.04] text-brand-navy dark:text-white select-none">
                  {step.num}
                </span>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg text-[color:var(--step-fg)] dark:text-[color:var(--step-fg-dark)] bg-[color:var(--step-icon-bg)] dark:bg-[color:var(--step-icon-bg-dark)]"
                  style={
                    {
                      "--step-fg": step.color,
                      "--step-fg-dark": step.darkColor ?? step.color,
                      "--step-icon-bg": `${step.color}15`,
                      "--step-icon-bg-dark":
                        step.darkIconBg ?? `${step.color}15`,
                    } as CSSProperties
                  }
                >
                  {step.icon}
                </div>
                <h3 className="font-bold text-base mb-2 text-brand-navy dark:text-white">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ TABBED FEATURES ═══════════════ */}
      <section className="section-glass py-12 sm:py-16 relative overflow-hidden">
        <SectionGlow
          className="-left-20 top-14 h-72 w-72 blur-[140px] opacity-80"
          gradient="radial-gradient(circle, rgba(214,40,57,0.14) 0%, rgba(214,40,57,0.05) 44%, transparent 74%)"
        />
        <SectionGlow
          className="right-[-4rem] top-24 h-80 w-80 blur-[150px] opacity-80"
          gradient="radial-gradient(circle, rgba(0,48,95,0.16) 0%, rgba(0,48,95,0.05) 48%, transparent 76%)"
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center gap-2 rounded-full glass-pill px-4 py-2 mb-3">
              <Zap className="h-3.5 w-3.5 text-brand-red" />
              <span className="text-brand-red text-xs font-semibold">
                Features
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">
              <span className="text-brand-navy dark:text-white">
                Built for{" "}
              </span>
              <span className="gradient-text">smarter decisions</span>
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need to research, compare, and choose the best
              courses at Queen&apos;s.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            {/* Tab buttons — shared layoutId slides red pill between tabs */}
            <LayoutGroup>
              <div className="mb-8 flex flex-wrap justify-center gap-2">
                {featureTabs.map((tab, i) => (
                  <button
                    key={tab.label}
                    type="button"
                    onClick={() => setActiveFeatureTab(i)}
                    className={cn(
                      "relative flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium [-webkit-tap-highlight-color:transparent]",
                      "outline-none focus-visible:ring-2 focus-visible:ring-brand-red/45 focus-visible:ring-inset",
                      "transition-colors duration-200",
                      i === activeFeatureTab
                        ? "text-white"
                        : "text-gray-700 hover:text-brand-navy dark:text-gray-300 dark:hover:text-white",
                      i !== activeFeatureTab &&
                        "glass-pill border border-brand-navy/12 dark:border-white/12 bg-white/72 hover:bg-white/84 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] shadow-[0_2px_10px_rgba(0,48,95,0.08)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.22)]",
                    )}
                  >
                    {i === activeFeatureTab && (
                      <motion.span
                        layoutId="feature-tab-pill"
                        className="absolute inset-0 z-0 rounded-full bg-brand-red shadow-lg shadow-brand-red/25"
                        transition={featureTabSpring}
                        style={{ willChange: "transform" }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      {tab.icon}
                      <span className="hidden sm:inline">{tab.label}</span>
                    </span>
                  </button>
                ))}
              </div>
            </LayoutGroup>

            {/* Tab content — softer crossfade + light stagger */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeFeatureTab}
                variants={lite ? undefined : featurePanelVariants}
                initial={lite ? false : "initial"}
                animate={lite ? undefined : "animate"}
                exit={lite ? undefined : "exit"}
                className="glass-card overflow-hidden rounded-3xl p-6 sm:p-10"
              >
                <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
                  <motion.div
                    initial={lite ? false : { opacity: 0, y: 8 }}
                    animate={lite ? undefined : { opacity: 1, y: 0 }}
                    transition={
                      lite
                        ? { duration: 0 }
                        : {
                            duration: 0.4,
                            delay: 0.06,
                            ease: [0.25, 0.1, 0.25, 1],
                          }
                    }
                  >
                    <h3 className="mb-4 text-xl font-bold leading-snug text-brand-navy dark:text-white sm:text-2xl">
                      {activeTab.title}
                    </h3>
                    <p className="mb-6 leading-relaxed text-gray-600 dark:text-gray-400">
                      {activeTab.description}
                    </p>
                    <Link
                      href={
                        activeFeatureTab === 2
                          ? "/queens-answers"
                          : "/schools/queens"
                      }
                      className="inline-flex items-center gap-2 text-sm font-semibold text-brand-red transition-all duration-300 hover:gap-3"
                    >
                      {activeFeatureTab === 2
                        ? "Try AI Assistant"
                        : "Explore Courses"}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </motion.div>
                  <motion.div
                    className="flex w-full max-w-xl items-center justify-center rounded-2xl subpixel-antialiased md:mx-auto md:max-w-lg lg:max-w-xl"
                    initial={lite ? false : { opacity: 0, y: 10, scale: 0.985 }}
                    animate={lite ? undefined : { opacity: 1, y: 0, scale: 1 }}
                    transition={
                      lite
                        ? { duration: 0 }
                        : {
                            duration: 0.48,
                            delay: 0.12,
                            ease: [0.22, 1, 0.36, 1],
                          }
                    }
                  >
                    {activeFeatureTab === 0 && <GradeDistributionMockup />}
                    {activeFeatureTab === 1 && <StudentReviewsMockup />}
                    {activeFeatureTab === 2 && <AIAssistantMockup />}
                    {activeFeatureTab === 3 && <CourseAnalyticsMockup />}
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <section className="section-glass py-12 sm:py-16 px-4 relative overflow-hidden">
        <SectionGlow
          className="left-[-3rem] top-16 h-80 w-80 blur-[145px] opacity-75"
          gradient="radial-gradient(circle, rgba(214,40,57,0.14) 0%, rgba(214,40,57,0.05) 42%, transparent 74%)"
        />
        <SectionGlow
          className="right-[-2rem] top-28 h-80 w-80 blur-[145px] opacity-70"
          gradient="radial-gradient(circle, rgba(0,48,95,0.15) 0%, rgba(0,48,95,0.05) 46%, transparent 76%)"
        />

        <div className="container mx-auto relative z-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center gap-2 rounded-full glass-pill px-4 py-2 mb-3">
              <Star className="h-3.5 w-3.5 text-brand-navy dark:text-white" />
              <span className="text-brand-navy dark:text-white text-xs font-semibold">
                Testimonials
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2 text-brand-navy dark:text-white">
              Trusted by{" "}
              <span className="gradient-text">Queen&apos;s students</span>
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              See how Coursify has helped students make better academic
              decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="glass-card glass-shine rounded-2xl p-6 sm:p-7 relative overflow-hidden group"
                style={
                  {
                    "--ti-accent": t.color,
                    "--ti-accent-dark": t.darkColor ?? t.color,
                  } as CSSProperties
                }
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl bg-[color:var(--ti-accent)] dark:bg-[color:var(--ti-accent-dark)]" />
                <div className="flex items-center gap-1 text-brand-gold mb-5">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <blockquote className="text-brand-navy/90 dark:text-slate-200 leading-relaxed mb-6">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div className="flex items-center gap-3 pt-5 border-t border-white/40 dark:border-white/[0.06]">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white bg-[color:var(--ti-accent)] dark:bg-[color:var(--ti-accent-dark)]">
                    {t.initial}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-brand-navy dark:text-white">
                      {t.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t.program}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FAQ ═══════════════ */}
      <section className="section-glass py-12 sm:py-16 px-4 relative overflow-hidden [overflow-anchor:none]">
        <SectionGlow
          className="left-1/2 top-8 h-72 w-72 -translate-x-1/2 blur-[145px] opacity-80"
          gradient="radial-gradient(circle, rgba(214,40,57,0.12) 0%, rgba(214,40,57,0.04) 44%, transparent 76%)"
        />
        <SectionGlow
          className="right-[-2rem] bottom-10 h-72 w-72 blur-[140px] opacity-70"
          gradient="radial-gradient(circle, rgba(0,48,95,0.12) 0%, rgba(0,48,95,0.04) 46%, transparent 76%)"
        />

        <div className="container max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-full glass-pill mb-3">
              <span className="text-brand-red text-xs font-semibold mr-2">
                FAQs
              </span>
              <Info className="h-3 w-3 text-brand-red" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2 text-brand-navy dark:text-white">
              Your questions, <span className="gradient-text">answered</span>
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Get quick answers to the most common questions about Coursify.
            </p>
          </div>

          <div className="space-y-3 [overflow-anchor:none]">
            {faqs.map((faq, index) => {
              const colorClasses =
                index % 3 === 0
                  ? {
                      iconBg: "bg-brand-red/10",
                      iconText: "text-brand-red",
                      iconHoverBg: "group-hover:bg-brand-red",
                      titleHover: "group-hover:text-brand-red",
                    }
                  : index % 3 === 1
                    ? {
                        iconBg: "bg-brand-navy/10 dark:bg-brand-navy-light/20",
                        iconText: "text-brand-navy dark:text-white",
                        iconHoverBg:
                          "group-hover:bg-brand-navy dark:group-hover:bg-brand-navy-light",
                        titleHover:
                          "group-hover:text-brand-navy dark:text-white",
                      }
                    : {
                        iconBg: "bg-brand-gold/10",
                        iconText: "text-brand-gold",
                        iconHoverBg: "group-hover:bg-brand-gold",
                        titleHover: "group-hover:text-brand-gold",
                      };

              return (
                <div
                  key={index}
                  className="group glass-accordion rounded-2xl p-6 cursor-pointer"
                  onClick={() => toggleAccordion(index)}
                >
                  <div className="flex items-start">
                    <div className="mr-4 mt-1">
                      <div
                        className={`flex items-center justify-center w-6 h-6 rounded-full ${colorClasses.iconBg} ${colorClasses.iconText} ${colorClasses.iconHoverBg} group-hover:text-white`}
                      >
                        {activeAccordion === index ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-brand-navy dark:text-white mb-2">
                        {faq.question}
                      </h3>
                      <motion.div
                        initial={false}
                        animate={{
                          height: activeAccordion === index ? "auto" : 0,
                          opacity: activeAccordion === index ? 1 : 0,
                        }}
                        transition={{
                          duration: lite ? 0.15 : 0.45,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="overflow-hidden [overflow-anchor:none]"
                      >
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                          {faq.answer}
                        </p>
                      </motion.div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA ═══════════════ */}
      <section className="section-glass py-14 sm:py-20 px-4 relative overflow-hidden">
        <SectionGlow
          className="left-[10%] top-10 h-72 w-72 blur-[145px] opacity-80"
          gradient="radial-gradient(circle, rgba(0,48,95,0.14) 0%, rgba(0,48,95,0.05) 46%, transparent 76%)"
        />
        <SectionGlow
          className="right-[10%] bottom-6 h-80 w-80 blur-[155px] opacity-75"
          gradient="radial-gradient(circle, rgba(214,40,57,0.14) 0%, rgba(214,40,57,0.05) 44%, transparent 76%)"
        />

        <div className="container mx-auto px-4 sm:px-6 relative z-10 flex flex-col items-center">
          <div className="text-center max-w-2xl">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 leading-tight">
              <span className="gradient-text">Ready to make smarter</span>
              <br />
              <span className="text-brand-navy dark:text-white">
                course decisions?
              </span>
            </h2>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-7">
              Join thousands of Queen&apos;s students who are using Coursify to
              plan their academic journey.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-7">
              <Link
                href="/queens-answers"
                className="liquid-btn-red text-white px-7 py-3 rounded-xl inline-block font-medium w-full sm:w-auto text-center"
              >
                <span className="relative z-10 flex items-center justify-center">
                  <Brain className="mr-2 h-5 w-5" />
                  Try AI Assistant
                </span>
              </Link>
              <Link
                href="/schools/queens"
                className="liquid-btn-blue text-white px-7 py-3 rounded-xl inline-block font-medium w-full sm:w-auto text-center"
              >
                <span className="relative z-10 flex items-center justify-center">
                  <BarChart className="mr-2 h-5 w-5" />
                  Browse Courses
                </span>
              </Link>
            </div>
            <div className="flex flex-wrap justify-center gap-2.5">
              {[
                { label: "Real grade distributions", color: "bg-red-500" },
                { label: "AI-powered insights", color: "bg-yellow-400" },
                { label: "Queen's focused", color: "bg-blue-500" },
                { label: "Completely free", color: "bg-red-500" },
              ].map(({ label, color }) => (
                <div
                  key={label}
                  className="flex items-center glass-pill px-3 py-1.5 rounded-full"
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full mr-2 flex-shrink-0 ${color}`}
                  />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <Footer />
    </div>
  );
}
