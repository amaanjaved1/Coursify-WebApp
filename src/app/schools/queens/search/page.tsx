"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ArrowLeft, Upload, BarChart3, MessageSquare } from "lucide-react"
import { fetchCoursesPage } from "@/lib/db"
import { getCourseDataAvailability } from "@/lib/course-availability"
import type { CourseWithStats } from "@/types"

const COURSES_PER_PAGE = 25

export default function CourseSearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const initialQuery = searchParams.get("q") || ""
  const initialPage = Math.max(
    1,
    parseInt(searchParams.get("page") || "1", 10) || 1,
  )

  const [query, setQuery] = useState(initialQuery)
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(0)
  const [results, setResults] = useState<CourseWithStats[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    if (!submittedQuery.trim()) return

    const params = new URLSearchParams()
    params.set("q", submittedQuery)
    if (currentPage > 1) params.set("page", String(currentPage))
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })

    let cancelled = false
    setLoading(true)
    setSearched(true)

    fetchCoursesPage({
      search: submittedQuery,
      hasData: false,
      limit: COURSES_PER_PAGE,
      page: currentPage,
      sortBy: "code",
      sortDir: "asc",
    }).then((result) => {
      if (!cancelled) {
        setResults(result.courses)
        setTotal(result.total)
        setTotalPages(result.totalPages)
        const maxPage = Math.max(1, result.totalPages)
        if (currentPage > maxPage) {
          setCurrentPage(maxPage)
        }
      }
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })

    return () => { cancelled = true }
  }, [submittedQuery, currentPage, router, pathname])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      setCurrentPage(1)
      setSubmittedQuery(query.trim())
    }
  }

  const getGpaColor = (gpa: number) => {
    if (gpa >= 3.7) return "text-green-600"
    if (gpa >= 3.0) return "text-blue-600"
    if (gpa >= 2.3) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="relative min-h-screen overflow-hidden mesh-gradient pt-20">
      <style jsx global>{`
        .mesh-gradient {
          background: transparent;
        }
        .glass-card-deep {
          background: rgba(255, 255, 255, 0.72);
          backdrop-filter: blur(28px) saturate(170%);
          -webkit-backdrop-filter: blur(28px) saturate(170%);
          border: 1px solid rgba(255, 255, 255, 0.82);
          box-shadow:
            0 8px 32px rgba(0, 48, 95, 0.13),
            0 2px 8px rgba(0, 48, 95, 0.07),
            inset 0 1px 0 rgba(255, 255, 255, 0.95),
            inset 0 -1px 0 rgba(255, 255, 255, 0.3);
        }
        .search-glass {
          background: rgba(255, 255, 255, 0.72);
          backdrop-filter: blur(20px) saturate(160%);
          -webkit-backdrop-filter: blur(20px) saturate(160%);
          border: 1px solid rgba(255, 255, 255, 0.82);
          box-shadow:
            0 4px 20px rgba(0, 48, 95, 0.09),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
          border-radius: 0.75rem;
          padding: 0.5rem;
        }
        :is(.dark) .glass-card-deep {
          background: rgba(38, 38, 38, 0.82);
          backdrop-filter: blur(28px) saturate(170%);
          -webkit-backdrop-filter: blur(28px) saturate(170%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.3),
            0 2px 8px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.05),
            inset 0 -1px 0 rgba(255, 255, 255, 0.02);
        }
        :is(.dark) .search-glass {
          background: rgba(38, 38, 38, 0.82);
          backdrop-filter: blur(20px) saturate(160%);
          -webkit-backdrop-filter: blur(20px) saturate(160%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow:
            0 4px 20px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }
      `}</style>

      <div className="container py-12 px-4 lg:px-6 relative z-10 max-w-4xl mx-auto">
        <Link
          href="/schools/queens"
          className="inline-flex items-center gap-2 text-sm font-medium text-brand-navy dark:text-white mb-8 glass-pill px-4 py-2 rounded-full"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Course Explorer
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2 text-brand-navy dark:text-white">
            Search All Courses
          </h1>
          <p className="text-muted-foreground text-sm">
            Search our full catalog of Queen&apos;s courses, including those we don&apos;t have grade data for yet.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-3 mb-8 items-stretch">
          <div className="flex-1 search-glass">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-lg bg-brand-navy/10 dark:bg-blue-400/10">
                <Search className="h-3.5 w-3.5 text-brand-navy dark:text-white" />
              </div>
              <Input
                placeholder="Search by course code or name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-12 bg-transparent border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none text-brand-navy dark:text-white placeholder:text-brand-navy/40 dark:placeholder:text-white/40"
                autoFocus
              />
            </div>
          </div>
          <Button type="submit" className="liquid-btn-red border-0 text-white shrink-0 h-14 min-h-14 rounded-xl px-6">
            Search
          </Button>
        </form>

        {loading && (
          <div className="glass-card-deep rounded-xl p-8 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-navy dark:border-blue-400 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Searching courses...</p>
            </div>
          </div>
        )}

        {!loading && searched && (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {total} {total === 1 ? "course" : "courses"} found for &ldquo;{submittedQuery}&rdquo;
            </p>

            {results.length > 0 ? (
              <div className="space-y-3">
                {results.map((course) => {
                  const tier = getCourseDataAvailability(course)
                  const slug = course.course_code.replace(/\s+/g, "-").toLowerCase()

                  return (
                    <Link
                      key={course.id}
                      href={`/schools/queens/${slug}`}
                      className="block glass-card-deep rounded-xl p-5 hover:bg-white/80 dark:hover:bg-white/[0.06] transition-colors duration-200"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-brand-red">{course.course_code}</span>
                            {tier === "data" && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-2 py-0.5 rounded-full">
                                <BarChart3 className="h-3 w-3 shrink-0" />
                                Data available
                              </span>
                            )}
                            {tier === "comments" && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-300 px-2 py-0.5 rounded-full">
                                <MessageSquare className="h-3 w-3 shrink-0" />
                                Comments only
                              </span>
                            )}
                            {tier === "none" && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                                No data available
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-brand-navy dark:text-white truncate">{course.course_name}</p>
                          {course.department && (
                            <p className="text-xs text-muted-foreground mt-1">{course.department}</p>
                          )}
                        </div>
                        {tier === "data" && (
                          <div className="flex items-center gap-4 text-sm shrink-0">
                            <div>
                              <span className="text-xs text-muted-foreground block">Avg. GPA</span>
                              <span className={`font-semibold ${getGpaColor(course.averageGPA)}`}>
                                {course.averageGPA.toFixed(1)}
                              </span>
                            </div>
                            {course.totalEnrollment > 0 && (
                              <div>
                                <span className="text-xs text-muted-foreground block">Enrollment</span>
                                <span className="font-semibold text-brand-navy dark:text-white">
                                  {Math.round(course.totalEnrollment)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        {tier === "comments" && (
                          <div className="text-xs text-muted-foreground shrink-0 sm:text-right">
                            Grade stats not on file — student reviews may be available on the course page.
                          </div>
                        )}
                      </div>
                    </Link>
                  )
                })}

                {total > 0 && (
                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-white/50 dark:border-white/10">
                    <p className="text-sm text-muted-foreground">
                      Showing{" "}
                      {results.length > 0
                        ? (currentPage - 1) * COURSES_PER_PAGE + 1
                        : 0}
                      –{Math.min(currentPage * COURSES_PER_PAGE, total)} of{" "}
                      {total} courses
                    </p>
                    {totalPages > 1 && (
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((p) => Math.max(1, p - 1))
                          }
                          disabled={currentPage <= 1}
                          className="glass-btn border-0 text-brand-navy dark:text-white hover:bg-white/30"
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((p) =>
                              Math.min(p + 1, totalPages),
                            )
                          }
                          disabled={currentPage >= totalPages}
                          className="glass-btn border-0 text-brand-navy dark:text-white hover:bg-white/30"
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-card-deep rounded-xl p-8 text-center">
                <p className="text-muted-foreground mb-4">No courses found matching &ldquo;{submittedQuery}&rdquo;.</p>
              </div>
            )}

            {/* CTA to add data */}
            <div className="mt-8 p-6 glass-card-deep rounded-xl text-center">
              <Upload className="h-8 w-8 text-brand-gold mx-auto mb-3" />
              <h3 className="text-base font-bold text-brand-navy dark:text-white mb-2">Help grow our database</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
                Have a grade distribution PDF? Upload it to help other Queen&apos;s students make informed decisions.
              </p>
              <Button asChild className="liquid-btn-red border-0 text-white">
                <a href="/add-courses">Upload Grade Distributions</a>
              </Button>
            </div>
          </>
        )}

        {!loading && !searched && (
          <div className="glass-card-deep rounded-xl p-8 text-center">
            <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Enter a course code or name to search the full catalog.</p>
          </div>
        )}
      </div>
    </div>
  )
}
