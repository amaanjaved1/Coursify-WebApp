'use client'

import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
} from 'recharts'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { CourseWithStats } from '@/types'
import { GRADE_LABELS, GRADE_COLORS, brightenHex } from '../_lib/chart-helpers'
import { gpaValueTextClass, GpaSpectrumBar, formatAcademicTerm } from '../_lib/gpa-utils'

const ENROLLMENT_BAR_MAX = 600

interface GradeDistributionChartProps {
  course: CourseWithStats
  selectedTerm: string
  onTermChange: (term: string) => void
  isDark: boolean
}

export function GradeDistributionChart({
  course,
  selectedTerm,
  onTermChange,
  isDark,
}: GradeDistributionChartProps) {
  const [activeGradeIndex, setActiveGradeIndex] = useState<number | null>(null)

  useEffect(() => {
    setActiveGradeIndex(null)
  }, [selectedTerm])

  const selectedDistribution = course.distributions.find(d => d.term === selectedTerm)
  const hasDistributions = course.distributions.length > 0

  const gradeDistributionData = selectedDistribution
    ? GRADE_LABELS.map((grade, index) => ({
        grade,
        count: selectedDistribution.grade_counts[index] || 0,
        fill: GRADE_COLORS[grade as keyof typeof GRADE_COLORS] || '#ccc',
      }))
    : []

  const handleGradeChartHover = (state: unknown) => {
    if (!state || typeof state !== 'object' || !('activeTooltipIndex' in state)) {
      setActiveGradeIndex(null)
      return
    }
    const tooltipIndex = (state as { activeTooltipIndex?: number | string }).activeTooltipIndex
    const parsedIndex = typeof tooltipIndex === 'number' ? tooltipIndex : Number.parseInt(`${tooltipIndex ?? ''}`, 10)
    setActiveGradeIndex(Number.isNaN(parsedIndex) ? null : parsedIndex)
  }

  return (
    <div className="glass-card-deep flex h-full min-h-0 flex-col rounded-2xl p-5">
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
        {hasDistributions && (
          <Select value={selectedTerm} onValueChange={onTermChange}>
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
          <div className="mt-4 flex min-h-[160px] min-w-0 flex-1 flex-col overflow-hidden rounded-xl chart-area-bg">
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
                  <XAxis dataKey="grade" tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#9ca3af' }} axisLine={false} tickLine={false} dy={4} />
                  <YAxis tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#9ca3af' }} axisLine={false} tickLine={false} width={28} tickFormatter={(v) => `${v}%`} />
                  <RechartsTooltip
                    cursor={false}
                    formatter={(value) => [`${value}%`, 'Students']}
                    labelFormatter={(label) => `Grade ${label}`}
                    itemStyle={{ color: isDark ? '#e2e8f0' : '#0f172a' }}
                    labelStyle={{ color: isDark ? '#cbd5e1' : '#334155' }}
                    contentStyle={{
                      backgroundColor: isDark ? 'rgba(32,32,32,0.97)' : 'rgba(255,255,255,0.92)',
                      backdropFilter: 'none',
                      borderRadius: '10px',
                      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.8)',
                      boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,48,95,0.12)',
                      fontSize: '12px',
                      color: isDark ? '#e2e8f0' : '#0f172a',
                    }}
                  />
                  <Bar dataKey="count" name="Students" isAnimationActive={false} radius={[4, 4, 0, 0]}>
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

          <div className="mt-4 shrink-0 grid grid-cols-2 gap-2.5">
            <div className="course-detail-inset-glass rounded-xl p-3 text-center flex flex-col">
              <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">Avg GPA</div>
              <div className={`mb-2 text-base font-bold ${gpaValueTextClass(selectedDistribution.average_gpa)}`}>
                {selectedDistribution.average_gpa.toFixed(2)}
              </div>
              <GpaSpectrumBar gpa={selectedDistribution.average_gpa} heightClass="h-1.5" />
              <div className="mt-1 flex w-full justify-between text-[10px] leading-none text-brand-navy/40 dark:text-white/40">
                <span>1.0</span><span>4.3</span>
              </div>
            </div>
            <div className="course-detail-inset-glass rounded-xl p-3 text-center flex flex-col">
              <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">Enrollment</div>
              <div className="mb-2 text-base font-bold text-brand-navy dark:text-white">{selectedDistribution.enrollment}</div>
              <div className="w-full overflow-hidden h-1.5 rounded-full bg-brand-navy/[0.09] dark:bg-blue-400/[0.09] border border-brand-navy/[0.06] dark:border-blue-400/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#00305f]/50 via-[#0066CC] to-[#d62839]/90"
                  style={{ width: `${Math.min((selectedDistribution.enrollment / ENROLLMENT_BAR_MAX) * 100, 100)}%` }}
                />
              </div>
              <div className="mt-1 flex w-full justify-between text-[10px] leading-none text-brand-navy/40 dark:text-white/40">
                <span>0</span><span>{ENROLLMENT_BAR_MAX}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex min-h-[14rem] flex-1 items-center justify-center rounded-xl chart-empty-bg">
          <p className="text-gray-400 dark:text-gray-500 text-sm">No grade distribution data available</p>
        </div>
      )}
    </div>
  );
}
