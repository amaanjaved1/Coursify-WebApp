'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts'
import type { CourseWithStats } from '@/types'
import { gpaTierHex, GPA_TREND_Y_DOMAIN, GPA_TREND_Y_TICKS } from '../_lib/gpa-utils'

interface GpaTrendChartProps {
  course: CourseWithStats
  termGpaData: Array<{ term: string; gpa: number }>
  isDark: boolean
}

export function GpaTrendChart({ course, termGpaData, isDark }: GpaTrendChartProps) {
  return (
    <div className="glass-card-deep flex h-full min-h-0 flex-col rounded-2xl p-5">
      <div className="shrink-0 flex items-center justify-between mb-1">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-brand-red rounded-full flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-brand-navy dark:text-white leading-tight">GPA Trend</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500">Average GPA across academic terms</p>
          </div>
        </div>
        <span className="course-detail-inset-glass inline-flex items-center text-brand-navy dark:text-white text-xs px-3 py-1.5 rounded-full font-semibold leading-none shrink-0">
          {course.course_code}
        </span>
      </div>

      {termGpaData.length > 0 ? (
        <div className="mt-4 flex min-h-[200px] min-w-0 flex-1 flex-col overflow-hidden rounded-xl chart-area-bg">
          <div className="min-h-0 h-full min-w-0 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={termGpaData}
                margin={{ top: 12, right: 12, left: 10, bottom: termGpaData.length > 6 ? 36 : 28 }}
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
                  label={{ value: 'Term', position: 'insideBottom', offset: termGpaData.length > 6 ? -4 : 2, style: { fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11, fontWeight: 600 } }}
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
                  label={{ value: 'GPA', angle: -90, position: 'insideLeft', style: { fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11, fontWeight: 600 }, offset: 8 }}
                />
                <RechartsTooltip
                  formatter={(value: number) => [
                    <span key="v" style={{ color: gpaTierHex(value), fontWeight: 700 }}>{value.toFixed(2)}</span>,
                    'GPA',
                  ]}
                  contentStyle={{
                    backgroundColor: isDark ? 'rgba(32,32,32,0.97)' : 'rgba(255,255,255,0.92)',
                    backdropFilter: 'none',
                    borderRadius: '10px',
                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.8)',
                    boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,48,95,0.12)',
                    fontSize: '12px',
                    color: isDark ? '#e2e8f0' : undefined,
                  }}
                />
                <Area
                  isAnimationActive={false}
                  type="monotone"
                  dataKey="gpa"
                  stroke="#94a3b8"
                  strokeWidth={2.5}
                  fill={`url(#gpaAreaFill-${course.id})`}
                  dot={(props: { cx?: number; cy?: number; payload?: { gpa: number } }) => {
                    const { cx, cy, payload } = props;
                    if (cx == null || cy == null || payload == null) return <g />;
                    const c = gpaTierHex(payload.gpa);
                    return <circle key={`gpa-dot-${cx}-${cy}`} cx={cx} cy={cy} r={4} fill="#fff" stroke={c} strokeWidth={2.5} />;
                  }}
                  activeDot={(props: { cx?: number; cy?: number; payload?: { gpa: number } }) => {
                    const { cx, cy, payload } = props;
                    if (cx == null || cy == null || payload == null) return <g />;
                    const c = gpaTierHex(payload.gpa);
                    return <circle key={`gpa-active-${cx}-${cy}`} cx={cx} cy={cy} r={6} fill={c} stroke="#fff" strokeWidth={2} />;
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex min-h-[14rem] flex-1 items-center justify-center rounded-xl chart-empty-bg">
          <p className="text-gray-400 dark:text-gray-500 text-sm">No historical GPA data available</p>
        </div>
      )}

      <div className="mt-4 shrink-0 flex flex-wrap justify-center gap-2">
        {[
          { label: 'A', range: '3.7–4.3', color: '#4CAF50' },
          { label: 'B', range: '2.7–3.3', color: '#CDDC39' },
          { label: 'C', range: '1.7–2.3', color: '#FF9800' },
          { label: 'D', range: '0.7–1.3', color: '#FF5722' },
          { label: 'F', range: '<0.7', color: '#D32F2F' },
        ].map(({ label, range, color }) => (
          <div key={label} className="course-detail-inset-glass inline-flex w-fit shrink-0 items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs max-w-full">
            <span className="w-2 h-2 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: color }} />
            <span className="text-brand-navy/80 dark:text-white/80 font-semibold">{label}</span>
            <span className="text-brand-navy/45 dark:text-white/45 whitespace-nowrap">{range}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
