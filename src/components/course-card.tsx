"use client"

import { motion } from "framer-motion"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { useMotionTier } from "@/lib/motion-prefs"

interface Course {
  code: string
  name: string
  gpa: number
  difficulty: string
  professor: string
  tags: string[]
}

interface CourseCardProps {
  course: Course
  index: number
  total: number
}

export const CourseCard = ({ course, index, total }: CourseCardProps) => {
  const lite = useMotionTier() === "lite";
  // Get color based on GPA
  const getGpaColor = (gpa: number) => {
    if (gpa >= 3.7) return "text-green-600"
    if (gpa >= 3.0) return "text-blue-600"
    if (gpa >= 2.3) return "text-yellow-600"
    return "text-red-600"
  }

  // Get color based on difficulty
  const getDifficultyColor = (difficulty: string) => {
    if (difficulty === "Easy") return "bg-green-100 text-green-800"
    if (difficulty === "Moderate") return "bg-yellow-100 text-yellow-800"
    if (difficulty === "Hard") return "bg-red-100 text-red-800"
    return "bg-gray-100 text-gray-800"
  }

  return (
    <motion.div
      initial={lite ? false : { opacity: 0, y: 20 }}
      animate={lite ? undefined : { opacity: 1, y: 0 }}
      transition={lite ? { duration: 0 } : { duration: 0.5, delay: Math.min(index * 0.1, 0.5) }}
      className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-1"
    >
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-bold text-lg text-brand-navy dark:text-white">{course.code}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{course.name}</p>
          </div>
          <div className={`text-xl font-bold ${getGpaColor(course.gpa)}`}>{course.gpa.toFixed(1)}</div>
        </div>

        <div className="flex items-center mb-3">
          <div className="text-sm mr-2">Taught by:</div>
          <div className="text-sm font-medium">{course.professor}</div>
        </div>

        <div className="mb-3">
          <span className={`inline-block px-2 py-1 text-xs rounded-full ${getDifficultyColor(course.difficulty)}`}>
            {course.difficulty}
          </span>
        </div>

        <div className="flex flex-wrap gap-1 mb-4">
          {course.tags.map((tag, i) => (
            <span key={i} className="bg-gray-100 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
              {tag}
            </span>
          ))}
        </div>

        <Link
          href={`/schools/queens/${course.code.replace(/\s+/g, "-").toLowerCase()}`}
          className="flex items-center justify-center w-full text-sm text-brand-navy dark:text-white hover:text-brand-red transition-colors duration-300 mt-2 group-hover:underline"
        >
          View course details
          <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
        </Link>
      </div>
    </motion.div>
  )
}
