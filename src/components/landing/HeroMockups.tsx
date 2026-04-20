import {
  GradeDistributionMockup,
  StudentReviewsMockup,
  AIAssistantMockup,
} from "@/components/landing-mockups";

export default function HeroMockups() {
  return (
    <div className="relative hidden lg:flex flex-col gap-4 subpixel-antialiased [transform:translateZ(0)]">
      <div className="w-full">
        <GradeDistributionMockup />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-full rounded-2xl border border-white/60 dark:border-white/[0.08] bg-white/30 dark:bg-white/[0.03] backdrop-blur-sm p-3 flex flex-col">
          {/* Page header */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-brand-navy dark:text-white">Course Reviews</span>
            <span className="text-[10px] font-medium text-brand-navy px-2 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.96)', border: '1px solid rgba(255,255,255,0.98)' }}>12 reviews</span>
          </div>
          {/* Source filter tabs */}
          <div className="flex gap-1.5 mb-2.5">
            {[
              { label: "All", className: "bg-brand-navy text-white border border-brand-navy/30" },
              { label: "Reddit", className: "bg-[#FF4500]/10 text-[#FF4500] border border-[#FF4500]/25" },
              { label: "RateMyProf", className: "bg-brand-navy/10 text-brand-navy dark:bg-blue-500/15 dark:text-blue-300 border border-brand-navy/20 dark:border-blue-400/25" },
            ].map(({ label, className }) => (
              <span
                key={label}
                className={`text-[10px] font-medium px-2.5 py-1 rounded-lg select-none ${className}`}
              >
                {label}
              </span>
            ))}
          </div>
          {/* Comment cards */}
          <StudentReviewsMockup />
        </div>
        <div className="h-full">
          <AIAssistantMockup />
        </div>
      </div>
    </div>
  );
}
