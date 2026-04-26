'use client'

import { GPA_SCALE_MIN, GPA_SCALE_MAX } from './chart-helpers'

export type GpaTier = 1 | 2 | 3 | 4 | 5

export function gpaTier(gpa: number): GpaTier {
  if (!Number.isFinite(gpa)) return 1;
  if (gpa >= 3.7) return 5;
  if (gpa >= 3.0) return 4;
  if (gpa >= 2.3) return 3;
  if (gpa >= 1.7) return 2;
  return 1;
}

export const GPA_TIER_HEX: Record<GpaTier, string> = {
  1: '#D32F2F',
  2: '#FF9800',
  3: '#CDDC39',
  4: '#8BC34A',
  5: '#4CAF50',
}

export function gpaTierHex(gpa: number): string {
  return GPA_TIER_HEX[gpaTier(gpa)];
}

export function gpaBadgeClass(gpa: number): string {
  switch (gpaTier(gpa)) {
    case 5: return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
    case 4: return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400';
    case 3: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
    case 2: return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300';
    default: return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
  }
}

export function gpaValueTextClass(gpa: number): string {
  switch (gpaTier(gpa)) {
    case 5: return 'text-green-700 dark:text-green-400';
    case 4: return 'text-green-600 dark:text-green-400';
    case 3: return 'text-yellow-700 dark:text-yellow-400';
    case 2: return 'text-orange-700 dark:text-orange-400';
    default: return 'text-red-700 dark:text-red-400';
  }
}

export function gpaBarClipPercent(gpa: number): number {
  if (!Number.isFinite(gpa)) return 0;
  const t = ((gpa - GPA_SCALE_MIN) / (GPA_SCALE_MAX - GPA_SCALE_MIN)) * 100;
  return Math.max(0, Math.min(100, t));
}

export function gpaSpectrumInnerWidth(clipPercent: number): string {
  if (clipPercent <= 0.05) return '0%';
  return `${(100 / clipPercent) * 100}%`;
}

export const GPA_SPECTRUM_GRADIENT =
  'linear-gradient(to right, #b71c1c 0%, #e65100 16%, #f9a825 34%, #c0ca33 52%, #7cb342 74%, #2e7d32 100%)'

export const GPA_TREND_Y_DOMAIN: [number, number] = [0, 4.3]
export const GPA_TREND_Y_TICKS = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.3]



export function formatAcademicTerm(term: string): string {
  const compactMatch = term.match(/^([FWS])(\d{2})$/i);
  if (!compactMatch) return term;
  const [, seasonCode, shortYear] = compactMatch;
  const seasonMap: Record<string, string> = { F: 'Fall', W: 'Winter', S: 'Summer' };
  const season = seasonMap[seasonCode.toUpperCase()] ?? term;
  const year = 2000 + Number.parseInt(shortYear, 10);
  return `${season} ${year}`;
}

interface GpaSpectrumBarProps {
  gpa: number
  heightClass?: string
}

export function GpaSpectrumBar({ gpa, heightClass = 'h-2' }: GpaSpectrumBarProps) {
  const clip = gpaBarClipPercent(gpa);
  return (
    <div className={`overflow-hidden ${heightClass} rounded-full bg-brand-navy/[0.09] dark:bg-blue-400/[0.09] border border-brand-navy/[0.06] dark:border-blue-400/[0.06]`}>
      <div
        className="h-full overflow-hidden rounded-full"
        style={{ width: `${clip}%` }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: gpaSpectrumInnerWidth(clip), background: GPA_SPECTRUM_GRADIENT }}
        />
      </div>
    </div>
  );
}
