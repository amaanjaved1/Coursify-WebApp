"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowUp, Brain } from "lucide-react";
import { QUEENS_ANSWERS_DRAFT_STORAGE_KEY } from "@/constants/queens-answers";

const GRADE_COLORS: Record<string, string> = {
  "A+": "#4CAF50",
  A: "#4CAF50",
  "A-": "#8BC34A",
  "B+": "#CDDC39",
  B: "#CDDC39",
  "B-": "#FFEB3B",
  "C+": "#FFC107",
  C: "#FFC107",
  "C-": "#FF9800",
  "D+": "#FF5722",
  D: "#FF5722",
  "D-": "#F44336",
  F: "#D32F2F",
};

const GRADE_DATA = [
  { grade: "A+", pct: 12 },
  { grade: "A", pct: 24 },
  { grade: "A-", pct: 20 },
  { grade: "B+", pct: 16 },
  { grade: "B", pct: 12 },
  { grade: "B-", pct: 6 },
  { grade: "C+", pct: 4 },
  { grade: "C", pct: 3 },
  { grade: "C-", pct: 1.5 },
  { grade: "D+", pct: 0.8 },
  { grade: "D", pct: 0.4 },
  { grade: "D-", pct: 0.2 },
  { grade: "F", pct: 0.5 },
];

const MAX_PCT = 24;

/* ─────────────────────────────────────────────
   1. Grade Distribution
   ───────────────────────────────────────────── */

export function GradeDistributionMockup({
  compact = false,
}: {
  compact?: boolean;
}) {
  const barH = compact ? "h-20" : "h-[7.5rem] sm:h-32";
  const fontSize = compact ? "text-[8px]" : "text-[10px]";
  const pad = compact ? "p-3" : "p-6";

  return (
    <div className={`glass-card rounded-2xl ${pad} w-full select-none`}>
      <div className="flex items-center justify-between mb-1">
        <div>
          <span
            className={`${compact ? "text-xs" : "text-base"} font-semibold text-brand-navy dark:text-white`}
          >
            CISC 121
          </span>
          <span
            className={`${compact ? "text-[9px]" : "text-sm"} text-gray-400 ml-2`}
          >
            Intro to Computing
          </span>
        </div>
        <span
          className={`${compact ? "text-[8px]" : "text-xs"} text-gray-400 bg-white/50 dark:bg-white/5 px-2 py-0.5 rounded-md`}
        >
          Fall 2023
        </span>
      </div>

      <div className={`flex items-end gap-0.5 sm:gap-1 ${barH} mt-3`}>
        {GRADE_DATA.map((d) => (
          <div
            key={d.grade}
            className="flex flex-col items-center flex-1 h-full justify-end"
          >
            <div
              className="w-full rounded-t-sm min-h-[2px]"
              style={{
                height: `${(d.pct / MAX_PCT) * 100}%`,
                background: GRADE_COLORS[d.grade],
                opacity: 0.85,
              }}
            />
            <span className={`${fontSize} text-gray-400 mt-1 leading-none`}>
              {d.grade}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <div className={`${compact ? "text-[9px]" : "text-xs"} text-gray-400`}>
              Avg GPA
            </div>
            <div
              className={`${compact ? "text-sm" : "text-lg"} font-bold text-brand-navy dark:text-white`}
            >
              3.41
            </div>
          </div>
          <div>
            <div className={`${compact ? "text-[9px]" : "text-xs"} text-gray-400`}>
              Enrollment
            </div>
            <div
              className={`${compact ? "text-sm" : "text-lg"} font-bold text-brand-navy dark:text-white`}
            >
              326
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {[
            { label: "A", color: "#4CAF50" },
            { label: "B", color: "#CDDC39" },
            { label: "C", color: "#FFC107" },
            { label: "D", color: "#FF5722" },
            { label: "F", color: "#D32F2F" },
          ].map((g) => (
            <div key={g.label} className="flex items-center gap-0.5">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: g.color }}
              />
              <span
                className={`${compact ? "text-[8px]" : "text-[10px]"} text-gray-400`}
              >
                {g.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   2. Student Reviews
   ───────────────────────────────────────────── */

function RedditIcon({ size = 20 }: { size?: number }) {
  const srcPx = Math.min(128, Math.max(32, Math.round(size * 3)));
  return (
    <Image
      src="/reddit.png"
      alt=""
      width={srcPx}
      height={srcPx}
      quality={95}
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}

export function StudentReviewsMockup({
  compact = false,
}: {
  compact?: boolean;
}) {
  const pad = compact ? "p-3" : "p-5";
  const textSm = compact ? "text-[10px]" : "text-xs";
  const textXs = compact ? "text-[8px]" : "text-[11px]";

  return (
    <div className="w-full flex flex-col gap-2.5 select-none">
      {/* Reddit comment */}
      <div className={`glass-card rounded-2xl ${pad} w-full`}>
        <div className="flex items-center gap-2 mb-2">
          <RedditIcon size={compact ? 18 : 24} />
          <div>
            <div
              className={`${textSm} font-semibold text-gray-800 dark:text-gray-200`}
            >
              r/queensuniversity
            </div>
            <div className={`${textXs} text-gray-400`}>2 months ago</div>
          </div>
        </div>
        <p
          className={`${textSm} text-gray-700 dark:text-gray-300 leading-relaxed`}
        >
          {compact
            ? "Honestly one of the best courses I took at Queen's. Prof made the material super engaging."
            : "Honestly one of the best courses I took at Queen's. The professor made complex material feel approachable and the assignments actually prepared you for the exams."}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`${compact ? "h-3 w-3" : "h-3.5 w-3.5"} text-[#FF4500]`}
          >
            <path
              fillRule="evenodd"
              d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          <span className={`${textXs} text-gray-500`}>47 upvotes</span>
        </div>
      </div>

      {/* RMP comment */}
      <div className={`glass-card rounded-2xl ${pad} w-full`}>
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`${compact ? "w-[18px] h-[18px]" : "h-6 w-6"} rounded-full bg-brand-navy dark:bg-brand-navy-light flex items-center justify-center flex-shrink-0`}
          >
            <svg
              viewBox="0 0 20 20"
              fill="white"
              className={compact ? "w-2.5 h-2.5" : "w-3 h-3"}
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <div
              className={`${textSm} font-semibold text-gray-800 dark:text-gray-200`}
            >
              Anonymous
            </div>
            <div className="flex mt-0.5">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`${compact ? "h-2.5 w-2.5" : "h-3 w-3"} ${i < 4 ? "text-yellow-400" : "text-gray-200 dark:text-gray-600"}`}
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>
        </div>
        <p
          className={`${textSm} text-gray-700 dark:text-gray-300 leading-relaxed`}
        >
          {compact
            ? "Great prof! Clear lectures and fair exams. Would definitely recommend this class."
            : "Great professor! Lectures are well-organized, explains concepts clearly, and the exams are very fair. Office hours were always helpful."}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span
            className={`${textXs} font-medium px-2 py-0.5 rounded-md bg-brand-navy/8 dark:bg-brand-navy-light/18 text-brand-navy dark:text-white`}
          >
            Quality: 4.2/5
          </span>
          <span
            className={`${textXs} font-medium px-2 py-0.5 rounded-md bg-brand-red/8 text-brand-red`}
          >
            Difficulty: 2.8/5
          </span>
        </div>
      </div>

    </div>
  );
}

/* ─────────────────────────────────────────────
   3. AI Assistant
   ───────────────────────────────────────────── */

export function AIAssistantMockup({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const pad = compact ? "p-3" : "p-6";
  const textSm = compact ? "text-[10px]" : "text-sm";

  const goToQueensAnswers = () => {
    const q = draft.trim();
    if (q) sessionStorage.setItem(QUEENS_ANSWERS_DRAFT_STORAGE_KEY, q);
    else sessionStorage.removeItem(QUEENS_ANSWERS_DRAFT_STORAGE_KEY);
    router.push("/queens-answers");
  };

  const inputText = compact ? "text-[9px]" : "text-xs";
  const inputPad = compact ? "py-0.5" : "py-1.5";

  return (
    <div className={`glass-card rounded-2xl ${pad} w-full h-full flex flex-col select-none`}>
      <div className="flex items-center gap-2 mb-3">
        <div
          className={`gradient-text font-bold ${compact ? "text-xs" : "text-sm"}`}
        >
          Queen&apos;s Answers
        </div>
        <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse ml-auto" />
        <span
          className={`${compact ? "text-[9px]" : "text-xs"} text-gray-400`}
        >
          Online
        </span>
      </div>

      {/* User message */}
      <div className="flex justify-end mb-3">
        <div
          className={`${compact ? "max-w-[85%]" : "max-w-[80%]"} bg-brand-navy dark:bg-brand-navy-light text-white rounded-2xl rounded-tr-sm ${compact ? "px-3 py-2" : "px-4 py-3"}`}
        >
          <p className={`${textSm} leading-relaxed`}>
            {compact
              ? "Which CISC elective is the easiest?"
              : "I'm in second year CompSci — which CISC elective has the highest GPA and best professor reviews?"}
          </p>
        </div>
      </div>

      {/* AI response */}
      <div className="flex gap-2 mb-3">
        <div
          className={`${compact ? "w-6 h-6" : "w-8 h-8"} rounded-full bg-brand-red flex items-center justify-center flex-shrink-0`}
        >
          <Brain
            className={`${compact ? "h-3 w-3" : "h-4 w-4"} text-white`}
          />
        </div>
        <div
          className={`bg-white/60 dark:bg-white/[0.06] border border-white/80 dark:border-white/[0.08] rounded-2xl rounded-tl-sm ${compact ? "px-3 py-2" : "px-4 py-3"} flex-1`}
        >
          <p
            className={`${textSm} text-brand-navy dark:text-white leading-relaxed`}
          >
            Based on grade data and reviews,{" "}
            <span className="font-semibold">CISC 204</span> (Logic) has the
            highest avg GPA at{" "}
            <span className="font-semibold text-green-600 dark:text-green-400">
              3.62
            </span>
            . Students say Prof. Li is &ldquo;clear and organized.&rdquo;
          </p>
        </div>
      </div>

      {/* Input bar */}
      <div
        className={`mt-auto flex items-center gap-1.5 rounded-[1.35rem] border border-white/70 bg-white/65 shadow-[0_1px_3px_rgba(0,48,95,0.06)] backdrop-blur-sm transition-[box-shadow,border-color] focus-within:border-brand-red/35 focus-within:ring-2 focus-within:ring-brand-red/15 dark:border-white/[0.1] dark:bg-white/[0.06] dark:shadow-[0_1px_4px_rgba(0,0,0,0.2)] dark:focus-within:ring-brand-red/25 ${
          compact ? "px-2.5 py-1" : "px-3 py-1.5"
        }`}
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              goToQueensAnswers();
            }
          }}
          placeholder="Ask about any course or professor…"
          aria-label="Ask about any course or professor"
          className={`min-h-0 min-w-0 flex-1 bg-transparent py-1 outline-none select-text placeholder:text-gray-400 text-brand-navy dark:text-white ${inputText} ${inputPad}`}
        />
        <button
          type="button"
          onClick={goToQueensAnswers}
          aria-label="Go to Queen's Answers"
          className={`flex shrink-0 items-center justify-center rounded-full bg-brand-red text-white shadow-sm shadow-brand-red/25 transition-[transform,background-color,box-shadow] hover:bg-[#c01f2e] hover:shadow-md hover:shadow-brand-red/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red active:scale-[0.96] ${
            compact ? "h-7 w-7" : "h-9 w-9"
          }`}
        >
          <ArrowUp
            className={compact ? "h-3.5 w-3.5" : "h-[18px] w-[18px]"}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          />
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   4. Course Analytics
   ───────────────────────────────────────────── */

const TREND_DATA = [
  { term: "F21", gpa: 3.12 },
  { term: "W22", gpa: 3.28 },
  { term: "F22", gpa: 3.05 },
  { term: "W23", gpa: 3.41 },
  { term: "F23", gpa: 3.38 },
  { term: "W24", gpa: 3.52 },
];

const ENROLL_DATA = [
  { term: "F21", n: 280 },
  { term: "W22", n: 310 },
  { term: "F22", n: 295 },
  { term: "W23", n: 340 },
  { term: "F23", n: 326 },
  { term: "W24", n: 365 },
];

function gpaColor(gpa: number) {
  if (gpa >= 3.5) return "#4CAF50";
  if (gpa >= 3.0) return "#8BC34A";
  if (gpa >= 2.5) return "#CDDC39";
  if (gpa >= 2.0) return "#FF9800";
  return "#D32F2F";
}

function buildAreaPath(
  data: { x: number; y: number }[],
  w: number,
  h: number,
  close: boolean,
) {
  const pts = data.map((d) => `${d.x},${d.y}`).join(" L");
  if (!close) return `M${pts}`;
  return `M${data[0].x},${h} L${pts} L${data[data.length - 1].x},${h} Z`;
}

export function CourseAnalyticsMockup({
  compact = false,
}: {
  compact?: boolean;
}) {
  const pad = compact ? "p-3" : "p-6";
  const textSm = compact ? "text-[10px]" : "text-sm";

  const chartW = compact ? 260 : 304;
  const chartH = compact ? 72 : 112;
  const xPad = 4;
  const yMin = 2.8;
  const yMax = 3.7;

  const points = TREND_DATA.map((d, i) => ({
    x: xPad + (i / (TREND_DATA.length - 1)) * (chartW - 2 * xPad),
    y: chartH - ((d.gpa - yMin) / (yMax - yMin)) * chartH,
  }));

  return (
    <div className={`glass-card rounded-2xl ${pad} w-full select-none`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <div
          className={`${compact ? "w-6 h-6" : "w-8 h-8"} bg-brand-red rounded-full flex items-center justify-center flex-shrink-0`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`${compact ? "h-3.5 w-3.5" : "h-4 w-4"} text-white`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18"
            />
          </svg>
        </div>
        <div>
          <span
            className={`${compact ? "text-xs" : "text-base"} font-semibold text-brand-navy dark:text-white`}
          >
            GPA Trend
          </span>
          <span
            className={`${compact ? "text-[8px]" : "text-xs"} text-gray-400 ml-2`}
          >
            CISC 121
          </span>
        </div>
      </div>

      {/* SVG area chart */}
      <div className="mt-2 rounded-xl bg-white/40 dark:bg-white/[0.03] border border-white/60 dark:border-white/[0.06] overflow-hidden">
        <svg
          viewBox={`0 0 ${chartW} ${chartH}`}
          className="w-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="gpaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4CAF50" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#4CAF50" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <line
              key={t}
              x1={0}
              y1={t * chartH}
              x2={chartW}
              y2={t * chartH}
              stroke="currentColor"
              className="text-gray-200 dark:text-white/[0.06]"
              strokeWidth="0.5"
              strokeDasharray="3 3"
            />
          ))}
          <path
            d={buildAreaPath(points, chartW, chartH, true)}
            fill="url(#gpaFill)"
          />
          <path
            d={buildAreaPath(points, chartW, chartH, false)}
            fill="none"
            stroke="#94a3b8"
            strokeWidth={compact ? 2 : 2.25}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={compact ? 2.75 : 4}
              fill="white"
              stroke={gpaColor(TREND_DATA[i].gpa)}
              strokeWidth="1.5"
            />
          ))}
        </svg>
      </div>

      {/* X labels */}
      <div className="flex justify-between mt-1 px-1">
        {TREND_DATA.map((d) => (
          <span
            key={d.term}
            className={`${compact ? "text-[8px]" : "text-[10px]"} text-gray-400`}
          >
            {d.term}
          </span>
        ))}
      </div>

      {/* Enrollment mini-bars */}
      <div className="mt-3 flex items-center justify-between">
        <span
          className={`${textSm} font-medium text-gray-500 dark:text-gray-400`}
        >
          Enrollment
        </span>
        <div className={`flex items-end gap-1 ${compact ? "h-5" : "h-6"}`}>
          {ENROLL_DATA.map((d) => (
            <div key={d.term} className="flex flex-col items-center">
              <div
                className={`${compact ? "w-3.5" : "w-4"} rounded-t-sm bg-gradient-to-t from-brand-navy/60 to-brand-navy/30 dark:from-brand-navy-light/55 dark:to-brand-navy-light/22`}
                style={{
                  height: `${(d.n / 400) * (compact ? 20 : 24)}px`,
                }}
              />
            </div>
          ))}
        </div>
        <span className={`${textSm} font-bold text-brand-navy dark:text-white`}>
          365
        </span>
      </div>

      {/* Grade legend */}
      <div className="flex justify-center gap-2 mt-2">
        {[
          { label: "A", range: "3.7–4.3", color: "#4CAF50" },
          { label: "B", range: "2.7–3.6", color: "#CDDC39" },
          { label: "C", range: "1.7–2.6", color: "#FFC107" },
          { label: "D", range: "0.7–1.6", color: "#FF5722" },
        ].map((g) => (
          <div key={g.label} className="flex items-center gap-0.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: g.color }}
            />
            <span
              className={`${compact ? "text-[7px]" : "text-[9px]"} text-gray-400`}
            >
              {g.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
