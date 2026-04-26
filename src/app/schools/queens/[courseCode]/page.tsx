'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getCourseByCode } from '@/lib/db';
import type { CourseWithStats } from '@/types';
import { CourseComments } from "./_components/course-comments";
import { CourseHeader } from './_components/course-header'
import { GpaTrendChart } from './_components/gpa-trend-chart'
import { GradeDistributionChart } from './_components/grade-distribution-chart'
import { useTheme } from "next-themes";
import { Skeleton } from '@/components/ui/skeleton';
import {
  gpaBadgeClass,
  GpaSpectrumBar,
} from './_lib/gpa-utils'

function CourseDetailSkeleton() {
  return (
    <>
      {/* Hero */}
      <div className="container mx-auto px-6 md:px-10 lg:px-20 max-w-full pt-10 md:pt-16">
        <div className="glass-hero rounded-2xl overflow-hidden">
          <div className="p-8 md:p-10 space-y-4">
            <Skeleton className="h-4 w-32 bg-white/15" />
            <Skeleton className="h-5 w-20 bg-white/15" />
            <Skeleton className="h-12 w-52 bg-white/15" />
            <Skeleton className="h-7 w-80 bg-white/15" />
            <div className="rounded-xl bg-white/8 border border-white/10 p-4 space-y-2">
              <Skeleton className="h-4 w-full bg-white/15" />
              <Skeleton className="h-4 w-4/5 bg-white/15" />
            </div>
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="container mx-auto px-6 md:px-10 lg:px-20 max-w-full mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[0, 1, 2].map(i => (
            <div key={i} className="glass-card-deep rounded-2xl p-6">
              <Skeleton className="h-5 w-36 mb-5" />
              <div className="space-y-2.5">
                <Skeleton className="h-11 w-full rounded-xl" />
                <Skeleton className="h-11 w-full rounded-xl" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="container mx-auto px-6 md:px-10 lg:px-20 max-w-full grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {[0, 1].map(i => (
          <div key={i} className="glass-card-deep rounded-2xl p-5">
            <Skeleton className="h-5 w-32 mb-4" />
            <Skeleton className="h-52 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </>
  );
}

export default function CourseDetailPage() {
  const params = useParams();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const courseCode = params?.courseCode ? (params.courseCode as string).replace(/-/g, ' ').toUpperCase() : '';
  const [selectedTerm, setSelectedTerm] = useState<string>('');
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

  const enrollmentRounded = course ? Math.round(course.totalEnrollment) : 0;
  const enrollmentBarMax = 600;
  const enrollmentBarPct = Math.min((enrollmentRounded / enrollmentBarMax) * 100, 100);
  const termGpaData = course?.distributions?.length
    ? course.distributions.map((d) => ({ term: d.term, gpa: d.average_gpa })).reverse()
    : [];
  const facultyName = course?.department?.replace(/^Offering Faculty:/, '') || 'Faculty of Arts and Science';

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

      {loading && <CourseDetailSkeleton />}

      {!loading && (error || !course) && (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--page-bg)]">
          <div className="text-center glass-card-deep rounded-2xl p-12">
            <h1 className="text-3xl font-bold text-brand-red mb-4">Course Not Found</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">We couldn't find a course with code "{courseCode}".</p>
            <Link href="/schools/queens" className="px-6 py-3 bg-brand-navy text-white rounded-xl hover:bg-[#002244] transition">
              Return to Courses List
            </Link>
          </div>
        </div>
      )}

      {!loading && course && (
        <>
          {/* ── Hero Header ── */}
          <CourseHeader
            course={course}
            courseCode={courseCode}
            facultyName={facultyName}
          />

          {/* ── Info Cards Row ── */}
          <div className="container mx-auto px-6 md:px-10 lg:px-20 max-w-full mt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Course Details */}
              <div className="glass-card-deep rounded-2xl p-6 flex flex-col">
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
              </div>

              {/* Prerequisites */}
              <div className="glass-card-deep rounded-2xl p-6 flex flex-col">
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
              </div>

              {/* Performance Metrics */}
              <div className="glass-card-deep rounded-2xl p-6 flex flex-col">
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
                    <GpaSpectrumBar gpa={course.averageGPA} heightClass="h-2" />
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
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#00305f]/50 via-[#0066CC] to-[#d62839]/90"
                        style={{ width: `${enrollmentBarPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-brand-navy/45 dark:text-white/45 mt-0.5">
                      <span>0</span>
                      <span>{enrollmentBarMax}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Charts Section ── */}
          <div className="container mx-auto px-6 md:px-10 lg:px-20 max-w-full grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <GpaTrendChart
              course={course}
              termGpaData={termGpaData}
              isDark={isDark}
            />
            <GradeDistributionChart
              course={course}
              selectedTerm={selectedTerm}
              onTermChange={setSelectedTerm}
              isDark={isDark}
            />
          </div>

          {/* ── Student Comments ── */}
          <CourseComments courseCode={courseCode} />
        </>
      )}
    </div>
  );
}
