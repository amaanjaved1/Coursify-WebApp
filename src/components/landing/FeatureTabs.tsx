"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useMotionTier } from "@/lib/motion-prefs";
import { Brain, BarChart3, BarChart, MessageSquare, ArrowRight } from "lucide-react";
import {
  GradeDistributionMockup,
  StudentReviewsMockup,
  AIAssistantMockup,
  CourseAnalyticsMockup,
} from "@/components/landing-mockups";
import { cn } from "@/lib/utils";

const featureTabSpring = {
  type: "spring" as const,
  stiffness: 320,
  damping: 30,
  mass: 0.55,
};

const featurePanelVariants = {
  initial: { opacity: 0, y: 12, scale: 0.992 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1] as const,
      opacity: { duration: 0.42 },
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.996,
    transition: { duration: 0.28, ease: [0.4, 0, 1, 1] as const },
  },
};

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

export function FeatureTabs() {
  const [activeFeatureTab, setActiveFeatureTab] = useState(0);
  const motionTier = useMotionTier();
  const lite = motionTier === "lite";
  const activeTab = featureTabs[activeFeatureTab];

  return (
    <div className="max-w-5xl mx-auto">
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
                  : { duration: 0.4, delay: 0.06, ease: [0.25, 0.1, 0.25, 1] }
              }
            >
              <h3 className="mb-4 text-xl font-bold leading-snug text-brand-navy dark:text-white sm:text-2xl">
                {activeTab.title}
              </h3>
              <p className="mb-6 leading-relaxed text-gray-600 dark:text-gray-400">
                {activeTab.description}
              </p>
              <Link
                href={activeFeatureTab === 2 ? "/queens-answers" : "/schools/queens"}
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-red transition-all duration-300 hover:gap-3"
              >
                {activeFeatureTab === 2 ? "Try AI Assistant" : "Explore Courses"}
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
                  : { duration: 0.48, delay: 0.12, ease: [0.22, 1, 0.36, 1] }
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
  );
}
