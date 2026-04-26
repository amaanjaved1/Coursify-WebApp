'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { CourseWithStats } from '@/types'
import type { MotionTier } from '@/lib/motion-prefs'

interface CourseHeaderProps {
  course: CourseWithStats
  courseCode: string
  motionTier: MotionTier
  facultyName: string
}

export function CourseHeader({ course, courseCode, motionTier, facultyName }: CourseHeaderProps) {
  const lite = motionTier === "lite";
  const fadeIn = lite
    ? { hidden: { opacity: 1 }, visible: { opacity: 1, transition: { duration: 0 } } }
    : { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.5 } } };
  const slideUp = lite
    ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0, transition: { duration: 0 } } }
    : { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } } };
  const heroBreadcrumb = lite
    ? { hidden: { opacity: 1, x: 0 }, visible: { opacity: 1, x: 0, transition: { duration: 0 } } }
    : { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { duration: 0.4, delay: 0.1 } } };
  const heroFaculty = lite
    ? { hidden: { opacity: 1, x: 0 }, visible: { opacity: 1, x: 0, transition: { duration: 0 } } }
    : { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { duration: 0.5, delay: 0.2 } } };
  const heroH1 = lite
    ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0, transition: { duration: 0 } } }
    : { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.3 } } };
  const heroH2 = lite
    ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0, transition: { duration: 0 } } }
    : { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.4 } } };
  const heroDesc = lite
    ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0, transition: { duration: 0 } } }
    : { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.5 } } };

  return (
    <motion.div
      className="container mx-auto px-6 md:px-10 lg:px-20 max-w-full pt-10 md:pt-16"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <motion.div className="glass-hero rounded-2xl overflow-hidden relative" variants={slideUp}>
        <div className="relative p-8 md:p-10">
          <motion.div className="flex items-center gap-2 mb-5" variants={heroBreadcrumb}>
            <Link href="/schools/queens" className="text-white/60 hover:text-white/90 text-sm transition-colors flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Courses
            </Link>
            <span className="text-white/30 text-sm">/</span>
            <span className="text-white/60 text-sm">{courseCode}</span>
          </motion.div>

          <motion.div variants={heroFaculty}>
            <span className="inline-block px-3 py-1 bg-brand-red text-white text-xs font-medium rounded-lg mb-4">
              {facultyName}
            </span>
          </motion.div>

          <motion.h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight" variants={heroH1}>
            {course.course_code}
          </motion.h1>
          <motion.h2 className="text-xl md:text-2xl font-medium text-white/80 mb-6" variants={heroH2}>
            {course.course_name}
          </motion.h2>

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
  );
}
