"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Brain,
  BarChart3,
  BarChart,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import {
  GradeDistributionMockup,
  StudentReviewsMockup,
  AIAssistantMockup,
  CourseAnalyticsMockup,
} from "@/components/landing-mockups";
import { cn } from "@/lib/utils";

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
  const activeTab = featureTabs[activeFeatureTab];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 flex flex-wrap justify-center gap-2">
          {featureTabs.map((tab, i) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => setActiveFeatureTab(i)}
              className={cn(
                "relative flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium [-webkit-tap-highlight-color:transparent]",
                "outline-none focus-visible:ring-2 focus-visible:ring-brand-red/45 focus-visible:ring-inset",
                i === activeFeatureTab
                  ? "text-white"
                  : "text-gray-700 dark:text-gray-300",
                i !== activeFeatureTab &&
                  "glass-pill border border-brand-navy/12 dark:border-white/12 bg-white/72 dark:bg-white/[0.08] shadow-[0_2px_10px_rgba(0,48,95,0.08)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.22)]",
              )}
            >
              {i === activeFeatureTab && (
                <span className="absolute inset-0 z-0 rounded-full bg-brand-red shadow-lg shadow-brand-red/25" />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </span>
            </button>
          ))}
        </div>

      <div className="glass-card overflow-hidden rounded-3xl p-6 sm:p-10">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
          <div>
            <h3 className="mb-4 text-xl font-bold leading-snug text-brand-navy dark:text-white sm:text-2xl">
              {activeTab.title}
            </h3>
            <p className="mb-6 leading-relaxed text-gray-600 dark:text-gray-400">
              {activeTab.description}
            </p>
            <Link
              href={
                activeFeatureTab === 2 ? "/queens-answers" : "/schools/queens"
              }
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-red"
            >
              {activeFeatureTab === 2 ? "Try AI Assistant" : "Explore Courses"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex w-full max-w-xl items-center justify-center rounded-2xl subpixel-antialiased md:mx-auto md:max-w-lg lg:max-w-xl">
            {activeFeatureTab === 0 && <GradeDistributionMockup />}
            {activeFeatureTab === 1 && <StudentReviewsMockup />}
            {activeFeatureTab === 2 && <AIAssistantMockup />}
            {activeFeatureTab === 3 && <CourseAnalyticsMockup />}
          </div>
        </div>
      </div>
    </div>
  );
}
