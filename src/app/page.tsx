import { type CSSProperties } from "react";
import Link from "next/link";
import ReactCountryFlag from "react-country-flag";
import Footer from "@/components/footer";
import {
  Info,
  Zap,
  Award,
  UserPlus,
  Upload,
  Eye,
  Sparkles,
} from "lucide-react";
import { StudentCountBadge } from "@/components/landing/student-count-badge";
import { FeatureTabs } from "@/components/landing/feature-tabs";
import { PageFaq } from "@/components/landing/faq";
import { CourseSearchBar } from "@/components/course-search-bar";

function SectionGlow({
  className,
  gradient,
}: {
  className: string;
  gradient: string;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute rounded-full hidden md:block ${className}`}
      style={{ background: gradient }}
    />
  );
}

const steps = [
  {
    num: "01",
    title: "Create an Account",
    desc: "Sign up for free and personalize your course planning experience.",
    icon: <UserPlus className="h-6 w-6" />,
    color: "#d62839",
  },
  {
    num: "02",
    title: "Upload Grade Distributions",
    desc: "Contribute data to help the community make smarter decisions.",
    icon: <Upload className="h-6 w-6" />,
    color: "#00305f",
    darkColor: "#5a93c9",
    darkIconBg: "rgba(90, 147, 201, 0.22)",
  },
  {
    num: "03",
    title: "View Course Data",
    desc: "Explore real grade breakdowns, enrollment trends, and student reviews.",
    icon: <Eye className="h-6 w-6" />,
    color: "#efb215",
  },
  {
    num: "04",
    title: "Plan With Confidence",
    desc: "Use course data and student context to compare options before enrollment.",
    icon: <Sparkles className="h-6 w-6" />,
    color: "#d62839",
  },
];

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* ═══════════════ HERO ═══════════════ */}
      <section className="hero-grid relative min-h-screen overflow-x-hidden pt-16 sm:pt-20 pb-6 sm:pb-10">
        <SectionGlow
          className="left-[6%] top-28 h-72 w-72 blur-[145px] opacity-90"
          gradient="radial-gradient(circle, rgba(0,48,95,0.18) 0%, rgba(0,48,95,0.07) 48%, transparent 76%)"
        />
        <SectionGlow
          className="right-[8%] top-[18%] h-64 w-64 blur-[135px] opacity-80"
          gradient="radial-gradient(circle, rgba(214,40,57,0.16) 0%, rgba(214,40,57,0.06) 42%, transparent 74%)"
        />
        <SectionGlow
          className="bottom-24 left-1/2 h-80 w-80 -translate-x-1/2 blur-[150px] opacity-75"
          gradient="radial-gradient(circle, rgba(239,178,21,0.12) 0%, rgba(239,178,21,0.04) 45%, transparent 72%)"
        />

        <div className="container mx-auto px-6 sm:px-8 lg:px-12 relative z-10 min-h-[calc(100svh-6rem)] sm:min-h-[calc(100svh-7rem)] flex items-center">
          <div className="w-full flex flex-col items-center text-center max-w-3xl mx-auto">
            {/* Two tags */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
              <div className="inline-flex items-center gap-2 rounded-full glass-pill px-4 py-2">
                <ReactCountryFlag countryCode="RO" svg style={{ width: "1rem", height: "1rem" }} />
                <span className="text-xs font-semibold text-brand-navy dark:text-white whitespace-nowrap">
                  Queen&apos;s University
                </span>
              </div>
              <StudentCountBadge />
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-5 leading-tight tracking-tight">
              <span className="gradient-text-animated">
                Know your courses before you enroll
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 mb-10 max-w-lg leading-relaxed">
              Real grade distributions, professor reviews, and course context
            </p>

            {/* Search bar — primary CTA */}
            <CourseSearchBar
              className="w-full max-w-xl mb-5"
              placeholder="Search courses by code or name..."
            />

          </div>
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section className="section-glass py-12 sm:py-16 px-4 relative overflow-hidden">
        <SectionGlow
          className="left-1/2 top-12 h-80 w-80 -translate-x-1/2 blur-[155px] opacity-75"
          gradient="radial-gradient(circle, rgba(239,178,21,0.16) 0%, rgba(239,178,21,0.05) 44%, transparent 74%)"
        />
        <SectionGlow
          className="right-0 bottom-6 h-72 w-72 blur-[145px] opacity-70"
          gradient="radial-gradient(circle, rgba(0,48,95,0.14) 0%, rgba(0,48,95,0.04) 46%, transparent 74%)"
        />

        <div className="container mx-auto relative z-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center gap-2 rounded-full glass-pill px-4 py-2 mb-3">
              <Award className="h-3.5 w-3.5 text-brand-gold" />
              <span className="text-brand-gold text-xs font-semibold">
                How It Works
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2 text-brand-navy dark:text-white">
              Your path to{" "}
              <span className="text-brand-gold">smarter decisions</span>
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Get started in minutes. Here&apos;s how Coursify helps you plan
              your courses.
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((step) => (
              <div
                key={step.num}
                className="static-glass-card rounded-2xl p-6 relative overflow-hidden"
              >
                <span className="absolute top-3 right-4 text-6xl font-black opacity-[0.04] text-brand-navy dark:text-white select-none">
                  {step.num}
                </span>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-[color:var(--step-fg)] dark:text-[color:var(--step-fg-dark)] bg-[color:var(--step-icon-bg)] dark:bg-[color:var(--step-icon-bg-dark)]"
                  style={
                    {
                      "--step-fg": step.color,
                      "--step-fg-dark": step.darkColor ?? step.color,
                      "--step-icon-bg": `${step.color}15`,
                      "--step-icon-bg-dark":
                        step.darkIconBg ?? `${step.color}15`,
                    } as CSSProperties
                  }
                >
                  {step.icon}
                </div>
                <h3 className="font-bold text-base mb-2 text-brand-navy dark:text-white">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ TABBED FEATURES ═══════════════ */}
      <section className="section-glass py-12 sm:py-16 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center gap-2 rounded-full glass-pill px-4 py-2 mb-3">
              <Zap className="h-3.5 w-3.5 text-brand-red" />
              <span className="text-brand-red text-xs font-semibold">
                Features
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">
              <span className="text-brand-navy dark:text-white">
                Built for smarter decisions
              </span>
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need to research, compare, and choose the best
              courses at Queen&apos;s.
            </p>
          </div>

          <FeatureTabs />
        </div>
      </section>

      {/* ═══════════════ FAQ ═══════════════ */}
      <section className="section-glass py-12 sm:py-16 px-4 relative overflow-hidden [overflow-anchor:none]">
        <div className="container max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-full glass-pill mb-3">
              <span className="text-brand-red text-xs font-semibold mr-2">
                FAQs
              </span>
              <Info className="h-3 w-3 text-brand-red" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2 text-brand-navy dark:text-white">
              Your questions, answered
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Get quick answers to the most common questions about Coursify.
            </p>
          </div>

          <PageFaq />
        </div>
      </section>

      {/* ═══════════════ CTA ═══════════════ */}
      <section className="section-glass py-14 sm:py-20 px-4 relative overflow-hidden">
        <SectionGlow
          className="left-[10%] top-10 h-72 w-72 blur-[145px] opacity-80"
          gradient="radial-gradient(circle, rgba(0,48,95,0.14) 0%, rgba(0,48,95,0.05) 46%, transparent 76%)"
        />
        <SectionGlow
          className="right-[10%] bottom-6 h-80 w-80 blur-[155px] opacity-75"
          gradient="radial-gradient(circle, rgba(214,40,57,0.14) 0%, rgba(214,40,57,0.05) 44%, transparent 76%)"
        />

        <div className="container mx-auto px-4 sm:px-6 relative z-10 flex flex-col items-center">
          <div className="text-center max-w-2xl">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 leading-tight">
              <span className="text-brand-gold">Ready to make smarter</span>
              <br />
              <span className="text-brand-navy dark:text-white">
                course decisions?
              </span>
            </h2>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-7">
              Join Queen&apos;s students who are using Coursify to plan their
              academic journey.
            </p>
            <Link
              href="/sign-up"
              className="liquid-btn-gold inline-block px-8 py-3 rounded-xl font-semibold text-brand-navy text-sm sm:text-base w-full sm:w-auto text-center"
            >
              Sign Up — It&apos;s Free
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <Footer />
    </div>
  );
}
