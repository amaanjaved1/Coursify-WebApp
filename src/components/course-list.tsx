"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

type Course = {
  id: string
  code: string
  name: string
  description: string | null
  credits: number
  prerequisites: string | null
  corequisites: string | null
  departments: { name: string; code: string } | null
  course_levels: { level: string } | null
}

export function CourseList({ courses }: { courses: Course[] }) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredCourses = courses.filter(
    (course) =>
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <div className="space-y-6">
      <div className="relative">
        <Input
          type="search"
          placeholder="Search courses by code, name, or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      {filteredCourses.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No courses match your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="h-full flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-bold">{course.code}</CardTitle>
                  {course.course_levels && (
                    <Badge variant="outline" className="ml-2">
                      {course.course_levels.level} Level
                    </Badge>
                  )}
                </div>
                <h3 className="font-medium text-base mt-1">{course.name}</h3>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col">
                {course.description && <p className="text-sm text-gray-600 mb-4">{course.description}</p>}
                <div className="mt-auto space-y-2 text-sm">
                  <div className="flex items-center">
                    <span className="font-semibold mr-2">Credits:</span>
                    <span>{course.credits}</span>
                  </div>
                  {course.prerequisites && (
                    <div>
                      <span className="font-semibold">Prerequisites:</span>
                      <span className="ml-2">{course.prerequisites}</span>
                    </div>
                  )}
                  {course.corequisites && (
                    <div>
                      <span className="font-semibold">Corequisites:</span>
                      <span className="ml-2">{course.corequisites}</span>
                    </div>
                  )}
                  {course.departments && (
                    <div className="mt-2">
                      <Badge variant="secondary">{course.departments.name}</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
