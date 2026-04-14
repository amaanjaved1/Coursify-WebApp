'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, Cell,
} from 'recharts';
import { getCourseByCode } from '@/lib/db';
import type { CourseWithStats } from '@/types';
import { isUsingMockData } from "@/lib/db";
import { CourseComments } from "@/components/course-comments";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "next-themes";
import { useMotionTier, type MotionTier } from "@/lib/motion-prefs";

const GRADE_LABELS = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];

const GRADE_COLORS = {
  'A+': '#4CAF50', 'A': '#4CAF50', 'A-': '#8BC34A',
  'B+': '#CDDC39', 'B': '#CDDC39', 'B-': '#FFEB3B',
  'C+': '#FFC107', 'C': '#FFC107', 'C-': '#FF9800',
  'D+': '#FF5722', 'D': '#FF5722', 'D-': '#F44336',
  'F': '#D32F2F',
};

function brightenHex(hex: string, amount = 0.16): string {
  const normalized = hex.replace('#', '');
  const fullHex = normalized.length === 3
    ? normalized.split('').map((char) => `${char}${char}`).join('')
    : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(fullHex)) {
    return hex;
  }

  const channel = (offset: number) => Number.parseInt(fullHex.slice(offset, offset + 2), 16);
  const blend = (value: number) => Math.round(value + (255 - value) * amount);

  return `rgb(${blend(channel(0))}, ${blend(channel(2))}, ${blend(channel(4))})`;
}

function pageMotionVariants(tier: MotionTier) {
  const lite = tier === "lite";
  return {
    fadeIn: lite
      ? { hidden: { opacity: 1 }, visible: { opacity: 1, transition: { duration: 0 } } }
      : { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.5 } } },
    slideUp: lite
      ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0, transition: { duration: 0 } } }
      : { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } } },
    staggerContainer: lite
      ? { hidden: { opacity: 1 }, visible: { opacity: 1, transition: { staggerChildren: 0 } } }
      : { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } },
  };
}

const GPA_SCALE_MIN = 1;
const GPA_SCALE_MAX = 4.3;

/** Discrete tiers — thresholds align with badges; hex aligns with A–F legend chips */
type GpaTier = 1 | 2 | 3 | 4 | 5;

function gpaTier(gpa: number): GpaTier {
  if (!Number.isFinite(gpa)) return 1;
  if (gpa >= 3.7) return 5;
  if (gpa >= 3.0) return 4;
  if (gpa >= 2.3) return 3;
  if (gpa >= 1.7) return 2;
  return 1;
}

/** Line / dot / tooltip — same hues as grade-scale legend */
const GPA_TIER_HEX: Record<GpaTier, string> = {
  1: '#D32F2F',
  2: '#FF9800',
  3: '#CDDC39',
  4: '#8BC34A',
  5: '#4CAF50',
};

function gpaTierHex(gpa: number): string {
  return GPA_TIER_HEX[gpaTier(gpa)];
}

function gpaBadgeClass(gpa: number): string {
  switch (gpaTier(gpa)) {
    case 5:
      return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
    case 4:
      return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400';
    case 3:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
    case 2:
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300';
    default:
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
  }
}

function gpaValueTextClass(gpa: number): string {
  switch (gpaTier(gpa)) {
    case 5:
      return 'text-green-700 dark:text-green-400';
    case 4:
      return 'text-green-600 dark:text-green-400';
    case 3:
      return 'text-yellow-700 dark:text-yellow-400';
    case 2:
      return 'text-orange-700 dark:text-orange-400';
    default:
      return 'text-red-700 dark:text-red-400';
  }
}

/** Bar fill 0–100% where track ends are labeled 1.0 and 4.3 */
function gpaBarClipPercent(gpa: number): number {
  if (!Number.isFinite(gpa)) return 0;
  const t = ((gpa - GPA_SCALE_MIN) / (GPA_SCALE_MAX - GPA_SCALE_MIN)) * 100;
  return Math.max(0, Math.min(100, t));
}

/**
 * Full spectrum spans 1.0–4.3. Inner is wider than the clip so the tip color matches GPA.
 * Gradient stops align with the A–F tier colors used in the UI.
 */
function gpaSpectrumInnerWidth(clipPercent: number): string {
  if (clipPercent <= 0.05) return '0%';
  return `${(100 / clipPercent) * 100}%`;
}

const GPA_SPECTRUM_GRADIENT =
  'linear-gradient(to right, #b71c1c 0%, #e65100 16%, #f9a825 34%, #c0ca33 52%, #7cb342 74%, #2e7d32 100%)';

function GpaSpectrumBar({
  gpa,
  heightClass = 'h-2',
  transition = { duration: 1, delay: 0.5 },
}: {
  gpa: number;
  heightClass?: string;
  transition?: { duration?: number; delay?: number };
}) {
  const clip = gpaBarClipPercent(gpa);
  return (
    <div className={`overflow-hidden ${heightClass} rounded-full bg-brand-navy/[0.09] dark:bg-blue-400/[0.09] border border-brand-navy/[0.06] dark:border-blue-400/[0.06]`}>
      <motion.div
        className="h-full overflow-hidden rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${clip}%` }}
        transition={transition}
      >
        <div
          className="h-full rounded-full"
          style={{ width: gpaSpectrumInnerWidth(clip), background: GPA_SPECTRUM_GRADIENT }}
        />
      </motion.div>
    </div>
  );
}

const GPA_TREND_Y_DOMAIN: [number, number] = [0, 4.3];
const GPA_TREND_Y_TICKS = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.3];

function formatAcademicTerm(term: string): string {
  const compactMatch = term.match(/^([FWS])(\d{2})$/i);
  if (!compactMatch) return term;

  const [, seasonCode, shortYear] = compactMatch;
  const seasonMap: Record<string, string> = {
    F: 'Fall',
    W: 'Winter',
    S: 'Summer',
  };

  const season = seasonMap[seasonCode.toUpperCase()] ?? term;
  const year = 2000 + Number.parseInt(shortYear, 10);

  return `${season} ${year}`;
}

export default function CourseDetailPage() {
  const params = useParams();
  const motionTier = useMotionTier();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { fadeIn, slideUp, staggerContainer } = pageMotionVariants(motionTier);
  const chartsAnimate = motionTier === "full";
  const courseCode = params?.courseCode ? (params.courseCode as string).replace(/-/g, ' ').toUpperCase() : '';
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [activeGradeIndex, setActiveGradeIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [course, setCourse] = useState<CourseWithStats | null>(null);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        const courseData = await getCourseByCode(courseCode);
        if (!courseData) {
          setError(`Course ${courseCode} not found`);
          setLoading(false);
          return;
        }
        if (courseData.distributions && courseData.distributions.length > 0) {
          const uniqueDistributions = Array.from(
            new Map(courseData.distributions.map(dist => [dist.term, dist])).values()
          );
          courseData.distributions = uniqueDistributions;
          setSelectedTerm(uniqueDistributions[0].term);
        }
        setCourse(courseData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching course data:', err);
        setError('An error occurred while fetching course data');
        setLoading(false);
      }
    };
    if (courseCode) fetchCourseData();
  }, [courseCode]);

  useEffect(() => {
    setActiveGradeIndex(null);
  }, [selectedTerm]);

  if (loading) return null;

  if (error || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--page-bg)]">
        <div className="text-center glass-card-deep rounded-2xl p-12">
          <h1 className="text-3xl font-bold text-brand-red mb-4">Course Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">We couldn't find a course with code "{courseCode}".</p>
          <Link href="/schools/queens" className="px-6 py-3 bg-brand-navy text-white rounded-xl hover:bg-[#002244] transition">
            Return to Courses List
          </Link>
        </div>
      </div>
    );
  }

  const selectedDistribution = course.distributions.find(dist => dist.term === selectedTerm);
  const hasDistributions = course.distributions && course.distributions.length > 0;

  const enrollmentRounded = Math.round(course.totalEnrollment);
  const enrollmentBarMax = 600;
  const enrollmentBarPct = Math.min((enrollmentRounded / enrollmentBarMax) * 100, 100);

  const gradeDistributionData = selectedDistribution
    ? GRADE_LABELS.map((grade, index) => ({
        grade,
        count: selectedDistribution.grade_counts[index] || 0,
        fill: GRADE_COLORS[grade as keyof typeof GRADE_COLORS] || '#ccc'
      }))
    : [];

  const termGpaData = hasDistributions
    ? course.distributions.map(dist => ({ term: dist.term, gpa: dist.average_gpa })).reverse()
    : [];

  const facultyName = course.department?.replace(/^Offering Faculty:/, '') || 'Faculty of Arts and Science';

  const liteMotion = motionTier === "lite";
  const heroBreadcrumb = liteMotion
    ? { hidden: { opacity: 1, x: 0 }, visible: { opacity: 1, x: 0, transition: { duration: 0 } } }
    : { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { duration: 0.4, delay: 0.1 } } };
  const heroFaculty = liteMotion
    ? { hidden: { opacity: 1, x: 0 }, visible: { opacity: 1, x: 0, transition: { duration: 0 } } }
    : { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { duration: 0.5, delay: 0.2 } } };
  const heroH1 = liteMotion
    ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0, transition: { duration: 0 } } }
    : { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.3 } } };
  const heroH2 = liteMotion
    ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0, transition: { duration: 0 } } }
    : { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.4 } } };
  const heroDesc = liteMotion
    ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0, transition: { duration: 0 } } }
    : { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.5 } } };
  const barMotionTransition = chartsAnimate ? { duration: 1, delay: 0.5 } : { duration: 0, delay: 0 };
  const barMotionShort = chartsAnimate ? { duration: 0.8, delay: 0.2 } : { duration: 0, delay: 0 };
  const barMotionEnroll = chartsAnimate ? { duration: 0.8, delay: 0.25 } : { duration: 0, delay: 0 };
  const tooltipGlass = chartsAnimate ? ("blur(12px)" as const) : ("none" as const);
  const handleGradeChartHover = (state: unknown) => {
    if (!state || typeof state !== 'object' || !('activeTooltipIndex' in state)) {
      setActiveGradeIndex(null);
      return;
    }

    const tooltipIndex = (state as { activeTooltipIndex?: number | string }).activeTooltipIndex;
    const parsedIndex = typeof tooltipIndex === 'number' ? tooltipIndex : Number.parseInt(`${tooltipIndex ?? ''}`, 10);

    setActiveGradeIndex(Number.isNaN(parsedIndex) ? null : parsedIndex);
  };

  return (
    <div className="relative min-h-screen overflow-hidden pb-16 pt-20 course-detail-bg">
      <style jsx global>{`
        .course-detail-bg {
          background-color: var(--page-bg);
          background-image: none;
        }
        :is(.dark) .course-detail-bg {
          background-color: #171717;
          background-image: none;
        }
        .glass-card-deep {
          background: rgba(255,255,255,0.72);
          backdrop-filter: blur(28px) saturate(170%);
          -webkit-backdrop-filter: blur(28px) saturate(170%);
          border: 1px solid rgba(255,255,255,0.82);
          box-shadow:
            0 8px 32px rgba(0,48,95,0.13),
            0 2px 8px rgba(0,48,95,0.07),
            inset 0 1px 0 rgba(255,255,255,0.95),
            inset 0 -1px 0 rgba(255,255,255,0.3);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .glass-card-deep:hover {
          transform: translateY(-3px);
          box-shadow:
            0 16px 48px rgba(0,48,95,0.17),
            0 4px 14px rgba(0,48,95,0.09),
            inset 0 1px 0 rgba(255,255,255,0.98),
            inset 0 -1px 0 rgba(255,255,255,0.35);
        }
        :is(.dark) .glass-card-deep {
          background: rgba(38,38,38,0.80);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow:
            0 8px 32px rgba(0,0,0,0.3),
            0 2px 8px rgba(0,0,0,0.2),
            inset 0 1px 0 rgba(255,255,255,0.05),
            inset 0 -1px 0 rgba(255,255,255,0.02);
        }
        :is(.dark) .glass-card-deep:hover {
          box-shadow:
            0 16px 48px rgba(0,0,0,0.4),
            0 4px 14px rgba(0,0,0,0.25),
            inset 0 1px 0 rgba(255,255,255,0.08),
            inset 0 -1px 0 rgba(255,255,255,0.03);
        }
        .glass-hero {
          background: rgba(0,48,95,0.82);
          backdrop-filter: blur(32px) saturate(180%);
          -webkit-backdrop-filter: blur(32px) saturate(180%);
          border: 1px solid rgba(255,255,255,0.12);
          box-shadow:
            0 24px 64px rgba(0,48,95,0.35),
            0 4px 16px rgba(0,48,95,0.2),
            inset 0 1px 0 rgba(255,255,255,0.12);
        }
        :is(.dark) .glass-hero {
          background: rgba(0,30,60,0.85);
          border: 1px solid rgba(255,255,255,0.06);
          box-shadow:
            0 24px 64px rgba(0,0,0,0.4),
            0 4px 16px rgba(0,0,0,0.25),
            inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .stat-pill {
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.2);
          backdrop-filter: blur(8px);
        }
        .course-detail-inset-glass {
          background: linear-gradient(165deg, rgba(255,255,255,0.9) 0%, rgba(244,247,252,0.68) 42%, rgba(255,255,255,0.55) 100%);
          backdrop-filter: blur(22px) saturate(175%);
          -webkit-backdrop-filter: blur(22px) saturate(175%);
          border: 1px solid rgba(255,255,255,0.95);
          box-shadow:
            0 4px 24px rgba(0,48,95,0.1),
            0 1px 4px rgba(0,48,95,0.06),
            inset 0 1px 0 rgba(255,255,255,1),
            inset 0 -1px 0 rgba(0,48,95,0.07);
          transition: background 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .course-detail-inset-glass:hover {
          background: linear-gradient(165deg, rgba(255,255,255,0.97) 0%, rgba(248,250,255,0.8) 48%, rgba(255,255,255,0.72) 100%);
          border-color: rgba(255,255,255,1);
          box-shadow:
            0 8px 32px rgba(0,48,95,0.12),
            0 2px 10px rgba(0,48,95,0.07),
            inset 0 1px 0 rgba(255,255,255,1),
            inset 0 -1px 0 rgba(0,48,95,0.05);
        }
        :is(.dark) .course-detail-inset-glass {
          background: linear-gradient(165deg, rgba(48,48,48,0.85) 0%, rgba(40,40,40,0.65) 42%, rgba(35,35,35,0.55) 100%);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow:
            0 4px 24px rgba(0,0,0,0.2),
            0 1px 4px rgba(0,0,0,0.15),
            inset 0 1px 0 rgba(255,255,255,0.04),
            inset 0 -1px 0 rgba(255,255,255,0.02);
        }
        :is(.dark) .course-detail-inset-glass:hover {
          background: linear-gradient(165deg, rgba(55,55,55,0.92) 0%, rgba(48,48,48,0.80) 48%, rgba(42,42,42,0.70) 100%);
          border-color: rgba(255,255,255,0.12);
          box-shadow:
            0 8px 32px rgba(0,0,0,0.3),
            0 2px 10px rgba(0,0,0,0.2),
            inset 0 1px 0 rgba(255,255,255,0.06),
            inset 0 -1px 0 rgba(255,255,255,0.03);
        }
        button.course-detail-inset-glass[role="combobox"] {
          -webkit-tap-highlight-color: transparent;
          color: inherit;
        }
        button.course-detail-inset-glass[role="combobox"]:focus,
        button.course-detail-inset-glass[role="combobox"]:focus-visible,
        button.course-detail-inset-glass[role="combobox"]:active,
        button.course-detail-inset-glass[role="combobox"][data-state="open"] {
          outline: none;
          background: linear-gradient(165deg, rgba(255,255,255,0.96) 0%, rgba(250,251,255,0.86) 48%, rgba(255,255,255,0.78) 100%);
          border-color: rgba(255,255,255,0.95);
          box-shadow:
            0 6px 20px rgba(15,23,42,0.1),
            0 1px 4px rgba(15,23,42,0.06),
            inset 0 1px 0 rgba(255,255,255,1),
            inset 0 -1px 0 rgba(15,23,42,0.04);
        }
        :is(.dark) button.course-detail-inset-glass[role="combobox"]:focus,
        :is(.dark) button.course-detail-inset-glass[role="combobox"]:focus-visible,
        :is(.dark) button.course-detail-inset-glass[role="combobox"]:active,
        :is(.dark) button.course-detail-inset-glass[role="combobox"][data-state="open"] {
          background: linear-gradient(165deg, rgba(56,56,56,0.95) 0%, rgba(48,48,48,0.84) 48%, rgba(42,42,42,0.72) 100%);
          border-color: rgba(255,255,255,0.12);
          box-shadow:
            0 6px 20px rgba(0,0,0,0.25),
            0 1px 4px rgba(0,0,0,0.18),
            inset 0 1px 0 rgba(255,255,255,0.05),
            inset 0 -1px 0 rgba(255,255,255,0.02);
        }
        button.course-detail-inset-glass[role="combobox"]:hover {
          background: linear-gradient(165deg, rgba(255,255,255,0.97) 0%, rgba(248,250,255,0.8) 48%, rgba(255,255,255,0.72) 100%);
          border-color: rgba(255,255,255,1);
          box-shadow:
            0 8px 32px rgba(0,48,95,0.12),
            0 2px 10px rgba(0,48,95,0.07),
            inset 0 1px 0 rgba(255,255,255,1),
            inset 0 -1px 0 rgba(0,48,95,0.05);
        }
        :is(.dark) button.course-detail-inset-glass[role="combobox"]:hover {
          background: linear-gradient(165deg, rgba(58,58,58,0.95) 0%, rgba(50,50,50,0.82) 48%, rgba(44,44,44,0.72) 100%);
          border-color: rgba(255,255,255,0.12);
        }
        .chart-area-bg {
          background: linear-gradient(160deg, rgba(0,48,95,0.05) 0%, rgba(0,48,95,0.02) 100%);
          border: 1px solid rgba(255,255,255,0.7);
        }
        :is(.dark) .chart-area-bg {
          background: linear-gradient(160deg, rgba(35,35,35,0.55) 0%, rgba(28,28,28,0.35) 100%);
          border: 1px solid rgba(255,255,255,0.06);
        }
        .chart-empty-bg {
          background: rgba(255,255,255,0.3);
        }
        :is(.dark) .chart-empty-bg {
          background: rgba(35,35,35,0.45);
        }
      `}</style>

      {/* Mock data banner */}
      {isUsingMockData && (
        <div className="fixed top-4 right-4 z-50 max-w-md bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 shadow-md rounded-md">
          <p className="text-sm">Using mock data. Configure Supabase connection to use real data.</p>
        </div>
      )}

      {/* ── Hero Header ── */}
      <motion.div
        className="container mx-auto px-6 md:px-10 lg:px-20 max-w-full pt-10 md:pt-16"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <motion.div className="glass-hero rounded-2xl overflow-hidden relative" variants={slideUp}>
          <div className="relative p-8 md:p-10">
            {/* Breadcrumb */}
            <motion.div
              className="flex items-center gap-2 mb-5"
              variants={heroBreadcrumb}
            >
              <Link href="/schools/queens" className="text-white/60 hover:text-white/90 text-sm transition-colors flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Courses
              </Link>
              <span className="text-white/30 text-sm">/</span>
              <span className="text-white/60 text-sm">{courseCode}</span>
            </motion.div>

            {/* Faculty badge */}
            <motion.div variants={heroFaculty}>
              <span className="inline-block px-3 py-1 bg-brand-red text-white text-xs font-medium rounded-lg mb-4">
                {facultyName}
              </span>
            </motion.div>

            {/* Course code + name */}
            <motion.h1
              className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight"
              variants={heroH1}
            >
              {course.course_code}
            </motion.h1>
            <motion.h2
              className="text-xl md:text-2xl font-medium text-white/80 mb-6"
              variants={heroH2}
            >
              {course.course_name}
            </motion.h2>

            {/* Description */}
            <motion.div variants={heroDesc}>
              <div className="flex items-center gap-2 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">Course Description</h3>
              </div>
              <div className="bg-white/8 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-white/85 text-sm leading-relaxed">
                  {course.description
                    ? (typeof course.description === 'string' ? course.description : String(course.description))
                    : 'No description available for this course.'}
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Info Cards Row ── */}
      <motion.div
        className="container mx-auto px-6 md:px-10 lg:px-20 max-w-full mt-8"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Course Details */}
          <motion.div className="glass-card-deep rounded-2xl p-6 flex flex-col" variants={slideUp}>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-full bg-brand-navy/10 dark:bg-blue-400/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-brand-navy dark:text-white">Course Details</h3>
            </div>
            <ul className="space-y-2.5 flex-1">
              {[
                { label: 'Faculty', value: facultyName },
                { label: 'Credits', value: String(course.credits || 3) },
                { label: 'Available Terms', value: String(course.distributions?.length || 0) },
              ].map(({ label, value }) => (
                <li key={label} className="course-detail-inset-glass flex justify-between items-center gap-3 p-3 rounded-xl">
                  <span className="text-sm font-medium text-brand-navy/70 dark:text-white/70 shrink-0">{label}</span>
                  <span className="text-sm text-brand-navy dark:text-white font-semibold text-right max-w-[60%] truncate">{value}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Prerequisites */}
          <motion.div className="glass-card-deep rounded-2xl p-6 flex flex-col" variants={slideUp}>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-full bg-brand-navy/10 dark:bg-blue-400/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-brand-navy dark:text-white">Prerequisites</h3>
            </div>
            <div className="course-detail-inset-glass p-4 rounded-xl flex-1 flex items-start min-h-[5.5rem]">
              <p className="text-sm leading-relaxed text-brand-navy/85 dark:text-white/85">
                {course.course_requirements
                  ? String(course.course_requirements)
                  : course.description && course.description.toString().toLowerCase().includes('prerequisite')
                    ? course.description
                        .toString()
                        .split(/\n/)
                        .find(line =>
                          line.toLowerCase().includes('prerequisite') || line.toLowerCase().includes('prereq')
                        ) || 'No prerequisites on file.'
                    : 'No prerequisites on file.'}
              </p>
            </div>
          </motion.div>

          {/* Performance Metrics */}
          <motion.div className="glass-card-deep rounded-2xl p-6 flex flex-col" variants={slideUp}>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-full bg-brand-navy/10 dark:bg-blue-400/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-brand-navy dark:text-white">Performance</h3>
            </div>
            <div className="space-y-3 flex-1">
              <div className="course-detail-inset-glass rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-brand-navy dark:text-white">Average GPA</span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${gpaBadgeClass(course.averageGPA)}`}>
                    {course.averageGPA.toFixed(2)}
                  </span>
                </div>
                <GpaSpectrumBar gpa={course.averageGPA} heightClass="h-2" transition={barMotionTransition} />
                <div className="flex justify-between text-xs text-brand-navy/45 dark:text-white/45 mt-0.5">
                  <span>1.0</span>
                  <span>4.3</span>
                </div>
              </div>
              <div className="course-detail-inset-glass rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-brand-navy dark:text-white">Average Enrollment</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-navy/12 dark:bg-blue-400/12 text-brand-navy dark:text-white">
                    {enrollmentRounded}
                  </span>
                </div>
                <div className="overflow-hidden h-2 rounded-full bg-brand-navy/[0.09] dark:bg-blue-400/[0.09] border border-brand-navy/[0.06] dark:border-blue-400/[0.06]">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#00305f]/50 via-[#0066CC] to-[#d62839]/90"
                    initial={{ width: 0 }}
                    animate={{ width: `${enrollmentBarPct}%` }}
                    transition={chartsAnimate ? { duration: 1, delay: 0.55 } : { duration: 0, delay: 0 }}
                  />
                </div>
                <div className="flex justify-between text-xs text-brand-navy/45 dark:text-white/45 mt-0.5">
                  <span>0</span>
                  <span>{enrollmentBarMax}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* ── Charts Section ── */}
      <motion.div
        className="container mx-auto px-6 md:px-10 lg:px-20 max-w-full grid grid-cols-1 md:grid-cols-2 gap-6 mt-6"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* GPA Trend — chart area flex-1 + 100% ResponsiveContainer fills card to match Grade column height */}
        <motion.div className="glass-card-deep flex h-full min-h-0 flex-col rounded-2xl p-5" variants={slideUp}>
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between mb-1">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-brand-red rounded-full flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-brand-navy dark:text-white leading-tight">GPA Trend</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Average GPA across academic terms
                </p>
              </div>
            </div>
            <span className="course-detail-inset-glass inline-flex items-center text-brand-navy dark:text-white text-xs px-3 py-1.5 rounded-full font-semibold leading-none shrink-0">
              {course.course_code}
            </span>
          </div>

          {hasDistributions ? (
            <div
              className="mt-4 flex min-h-[200px] min-w-0 flex-1 flex-col overflow-hidden rounded-xl chart-area-bg"
            >
              <div className="min-h-0 h-full min-w-0 w-full flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={termGpaData}
                    margin={{
                      top: 12,
                      right: 12,
                      left: 10,
                      bottom: termGpaData.length > 6 ? 36 : 28,
                    }}
                  >
                  <defs>
                    <linearGradient id={`gpaAreaFill-${course.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={gpaTierHex(course.averageGPA)} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={gpaTierHex(course.averageGPA)} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} />
                  <XAxis
                    dataKey="term"
                    type="category"
                    interval={0}
                    angle={termGpaData.length > 6 ? -35 : 0}
                    textAnchor={termGpaData.length > 6 ? 'end' : 'middle'}
                    height={termGpaData.length > 6 ? 52 : 32}
                    tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    dy={6}
                    label={{
                      value: 'Term',
                      position: 'insideBottom',
                      offset: termGpaData.length > 6 ? -4 : 2,
                      style: { fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11, fontWeight: 600 },
                    }}
                  />
                  <YAxis
                    domain={GPA_TREND_Y_DOMAIN}
                    ticks={GPA_TREND_Y_TICKS}
                    tickFormatter={(v) => {
                      const n = Number(v);
                      if (Math.abs(n - 4.3) < 1e-6) return '4.3';
                      if (Number.isInteger(n)) return `${n}`;
                      return n.toFixed(1);
                    }}
                    tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                    label={{
                      value: 'GPA',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11, fontWeight: 600 },
                      offset: 8,
                    }}
                  />
                  <RechartsTooltip
                    formatter={(value: number) => [
                      <span key="v" style={{ color: gpaTierHex(value), fontWeight: 700 }}>
                        {value.toFixed(2)}
                      </span>,
                      'GPA',
                    ]}
                    contentStyle={{
                      backgroundColor: isDark ? 'rgba(32,32,32,0.97)' : 'rgba(255,255,255,0.92)',
                      backdropFilter: tooltipGlass,
                      borderRadius: '10px',
                      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.8)',
                      boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,48,95,0.12)',
                      fontSize: '12px',
                      color: isDark ? '#e2e8f0' : undefined,
                    }}
                  />
                  <Area
                    isAnimationActive={chartsAnimate}
                    type="monotone"
                    dataKey="gpa"
                    stroke="#94a3b8"
                    strokeWidth={2.5}
                    fill={`url(#gpaAreaFill-${course.id})`}
                    dot={(props: { cx?: number; cy?: number; payload?: { gpa: number } }) => {
                      const { cx, cy, payload } = props;
                      if (cx == null || cy == null || payload == null) return <g />;
                      const c = gpaTierHex(payload.gpa);
                      const key = `gpa-dot-${cx}-${cy}-${payload.gpa}`;
                      return <circle key={key} cx={cx} cy={cy} r={4} fill="#fff" stroke={c} strokeWidth={2.5} />;
                    }}
                    activeDot={(props: { cx?: number; cy?: number; payload?: { gpa: number } }) => {
                      const { cx, cy, payload } = props;
                      if (cx == null || cy == null || payload == null) return <g />;
                      const c = gpaTierHex(payload.gpa);
                      const key = `gpa-active-dot-${cx}-${cy}-${payload.gpa}`;
                      return <circle key={key} cx={cx} cy={cy} r={6} fill={c} stroke="#fff" strokeWidth={2} />;
                    }}
                  />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div
              className="mt-4 flex min-h-[14rem] flex-1 items-center justify-center rounded-xl chart-empty-bg"
            >
              <p className="text-gray-400 dark:text-gray-500 text-sm">No historical GPA data available</p>
            </div>
          )}

          {/* Grade scale legend */}
          <div className="mt-4 shrink-0 flex flex-wrap justify-center gap-2">
            {[
              { label: 'A', range: '3.7–4.3', color: '#4CAF50' },
              { label: 'B', range: '2.7–3.3', color: '#CDDC39' },
              { label: 'C', range: '1.7–2.3', color: '#FF9800' },
              { label: 'D', range: '0.7–1.3', color: '#FF5722' },
              { label: 'F', range: '<0.7', color: '#D32F2F' },
            ].map(({ label, range, color }) => (
              <div
                key={label}
                className="course-detail-inset-glass inline-flex w-fit shrink-0 items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs max-w-full"
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: color }} />
                <span className="text-brand-navy/80 dark:text-white/80 font-semibold">{label}</span>
                <span className="text-brand-navy/45 dark:text-white/45 whitespace-nowrap">{range}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Grade Distribution */}
        <motion.div className="glass-card-deep flex h-full min-h-0 flex-col rounded-2xl p-5" variants={slideUp}>
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between mb-1">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-brand-red rounded-full flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-brand-navy dark:text-white leading-tight">Grade Distribution</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500">Percentage of students per grade</p>
              </div>
            </div>
            {course.distributions && course.distributions.length > 0 && (
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger
                  className="inline-flex h-auto min-h-0 min-w-[8.5rem] w-auto shrink-0 cursor-pointer items-center justify-between gap-0 rounded-full border border-brand-navy/10 bg-white/85 px-2.5 py-2 text-left text-[11px] font-semibold leading-none text-brand-navy shadow-[0_8px_24px_rgba(0,48,95,0.12)] outline-none ring-0 ring-offset-0 transition-[background,box-shadow,border-color,transform] duration-200 hover:border-brand-navy/20 hover:bg-white hover:shadow-[0_12px_28px_rgba(0,48,95,0.16)] focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=open]:border-brand-red/30 data-[state=open]:shadow-[0_12px_28px_rgba(214,40,57,0.18)] dark:border-white/10 dark:bg-white/10 dark:text-white dark:shadow-[0_8px_24px_rgba(0,0,0,0.24)] dark:hover:border-white/20 dark:hover:bg-white/14 dark:hover:shadow-[0_12px_28px_rgba(0,0,0,0.28)] dark:data-[state=open]:border-brand-red/40 dark:data-[state=open]:shadow-[0_12px_28px_rgba(214,40,57,0.22)] data-[placeholder]:text-brand-navy/55 dark:data-[placeholder]:text-white/55 [&>span]:line-clamp-1 [&>span]:text-left [&>span]:flex [&>span]:items-baseline [&>span]:gap-2 [&>span]:before:content-['Term'] [&>span]:before:text-[11px] [&>span]:before:font-bold [&>span]:before:uppercase [&>span]:before:tracking-[0.12em] [&>span]:before:text-brand-red dark:[&>span]:before:text-red-300 [&>svg]:ml-0 [&>svg]:mr-0.5 [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:shrink-0 [&>svg]:opacity-70"
                  aria-label="Select term for grade distribution"
                >
                  <SelectValue placeholder="Term" />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  align="end"
                  sideOffset={6}
                  className="z-[100] max-h-72 overflow-hidden rounded-lg border border-gray-200/90 dark:border-white/10 bg-white/95 dark:bg-neutral-900/95 p-0.5 text-gray-800 dark:text-white shadow-md backdrop-blur-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:[--tw-enter-scale:1] data-[state=closed]:[--tw-exit-scale:1] data-[side=bottom]:slide-in-from-top-0 data-[side=top]:slide-in-from-bottom-0"
                >
                  {course.distributions.map((dist) => (
                    <SelectItem
                      key={dist.term}
                      value={dist.term}
                      className="cursor-pointer rounded-md py-2 pl-8 pr-3 text-xs font-semibold text-gray-800 dark:text-white outline-none focus:bg-gray-100 dark:focus:bg-white/10 focus:text-gray-900 dark:focus:text-white data-[highlighted]:bg-gray-100 dark:data-[highlighted]:bg-white/10 data-[highlighted]:text-gray-900 dark:data-[highlighted]:text-white data-[state=checked]:bg-gray-100 dark:data-[state=checked]:bg-white/10"
                    >
                      {formatAcademicTerm(dist.term)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {hasDistributions && selectedDistribution ? (
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <div
                className="mt-4 flex min-h-[160px] min-w-0 flex-1 flex-col overflow-hidden rounded-xl chart-area-bg"
              >
                <div className="min-h-0 h-full min-w-0 w-full flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    key={`chart-${selectedTerm}`}
                    data={gradeDistributionData}
                    margin={{ top: 12, right: 12, left: 0, bottom: 8 }}
                    barCategoryGap="25%"
                    onMouseMove={handleGradeChartHover}
                    onMouseLeave={() => setActiveGradeIndex(null)}
                  >
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} />
                    <XAxis
                      dataKey="grade"
                      tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                      dy={4}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                      width={28}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <RechartsTooltip
                      cursor={false}
                      formatter={(value) => [`${value}%`, 'Students']}
                      labelFormatter={(label) => `Grade ${label}`}
                      itemStyle={{
                        color: isDark ? '#e2e8f0' : '#0f172a',
                      }}
                      labelStyle={{
                        color: isDark ? '#cbd5e1' : '#334155',
                      }}
                      contentStyle={{
                        backgroundColor: isDark ? 'rgba(32,32,32,0.97)' : 'rgba(255,255,255,0.92)',
                        backdropFilter: tooltipGlass,
                        borderRadius: '10px',
                        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.8)',
                        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,48,95,0.12)',
                        fontSize: '12px',
                        color: isDark ? '#e2e8f0' : '#0f172a',
                      }}
                    />
                    <Bar
                      dataKey="count"
                      name="Students"
                      isAnimationActive={chartsAnimate}
                      animationDuration={chartsAnimate ? 1200 : 0}
                      radius={[4, 4, 0, 0]}
                    >
                      {gradeDistributionData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={activeGradeIndex === index ? brightenHex(entry.fill) : entry.fill}
                          fillOpacity={activeGradeIndex === null ? 0.85 : activeGradeIndex === index ? 0.98 : 0.72}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Stats row — glass cards; Avg GPA includes mini scale bar */}
              <div className="mt-4 shrink-0 grid grid-cols-2 gap-2.5">
                <div className="course-detail-inset-glass rounded-xl p-3 text-center flex flex-col">
                  <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">Avg GPA</div>
                  <div className={`mb-2 text-base font-bold ${gpaValueTextClass(selectedDistribution.average_gpa)}`}>
                    {selectedDistribution.average_gpa.toFixed(2)}
                  </div>
                  <GpaSpectrumBar
                    gpa={selectedDistribution.average_gpa}
                    heightClass="h-1.5"
                    transition={barMotionShort}
                  />
                  <div className="mt-1 flex w-full justify-between text-[10px] leading-none text-brand-navy/40 dark:text-white/40">
                    <span>1.0</span>
                    <span>4.3</span>
                  </div>
                </div>
                <div className="course-detail-inset-glass rounded-xl p-3 text-center flex flex-col">
                  <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">Enrollment</div>
                  <div className="mb-2 text-base font-bold text-brand-navy dark:text-white">{selectedDistribution.enrollment}</div>
                  <div className="w-full overflow-hidden h-1.5 rounded-full bg-brand-navy/[0.09] dark:bg-blue-400/[0.09] border border-brand-navy/[0.06] dark:border-blue-400/[0.06]">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-[#00305f]/50 via-[#0066CC] to-[#d62839]/90"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((selectedDistribution.enrollment / enrollmentBarMax) * 100, 100)}%` }}
                      transition={barMotionEnroll}
                    />
                  </div>
                  <div className="mt-1 flex w-full justify-between text-[10px] leading-none text-brand-navy/40 dark:text-white/40">
                    <span>0</span>
                    <span>{enrollmentBarMax}</span>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div
              className="mt-4 flex min-h-[14rem] flex-1 items-center justify-center rounded-xl chart-empty-bg"
            >
              <p className="text-gray-400 dark:text-gray-500 text-sm">No grade distribution data available</p>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* ── Student Comments ── */}
      <CourseComments courseCode={courseCode} />
    </div>
  );
}
