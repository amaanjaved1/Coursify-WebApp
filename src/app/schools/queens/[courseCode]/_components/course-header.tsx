'use client'

import Link from 'next/link'
import type { CourseWithStats } from '@/types'

interface CourseHeaderProps {
  course: CourseWithStats
  courseCode: string
  facultyName: string
}

export function CourseHeader({ course, courseCode, facultyName }: CourseHeaderProps) {
  return (
    <div className="container mx-auto px-6 md:px-10 lg:px-20 max-w-full pt-10 md:pt-16">
      <div className="glass-hero rounded-2xl overflow-hidden relative">
        <div className="relative p-8 md:p-10">
          <div className="flex items-center gap-2 mb-5">
            <Link href="/schools/queens" className="text-white/60 hover:text-white/90 text-sm transition-colors flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Courses
            </Link>
            <span className="text-white/30 text-sm">/</span>
            <span className="text-white/60 text-sm">{courseCode}</span>
          </div>

          <div>
            <span className="inline-block px-3 py-1 bg-brand-red text-white text-xs font-medium rounded-lg mb-4">
              {facultyName}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
            {course.course_code}
          </h1>
          <h2 className="text-xl md:text-2xl font-medium text-white/80 mb-6">
            {course.course_name}
          </h2>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">Course Description</h3>
            </div>
            <div className="bg-white/8 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-white/85 text-sm leading-relaxed">
                {course.description ?? 'We currently do not have a description for this course.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
