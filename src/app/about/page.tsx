import { Card, CardContent } from "@/components/ui/card"
import {
  Github,
  Linkedin,
  ChevronRight,
  BarChart3,
  MessageSquare,
  Brain,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
import { ScrollButton } from "./_components/ScrollButton"
import { EmailCopyButton } from "./_components/EmailCopyButton"

export default function About() {
  return (
    <div className="relative min-h-screen overflow-x-clip pt-20">
      <div className="container pt-12 pb-0 px-4 md:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="relative mb-16 max-w-3xl mx-auto text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-10 top-6 h-48 w-48 rounded-full blur-[120px] opacity-80"
            style={{ background: "radial-gradient(circle, rgba(0,48,95,0.16) 0%, rgba(0,48,95,0.05) 45%, transparent 76%)" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute right-0 top-8 h-44 w-44 rounded-full blur-[120px] opacity-75"
            style={{ background: "radial-gradient(circle, rgba(214,40,57,0.14) 0%, rgba(214,40,57,0.05) 42%, transparent 74%)" }}
          />
          <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full static-glass-pill mb-4">
            <span className="text-sm font-semibold text-brand-navy dark:text-white">Our Story</span>
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-brand-gold" strokeWidth={2} aria-hidden />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-brand-navy dark:text-white">About</span> <span className="text-brand-red">Coursify</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Helping Queen&apos;s University students make informed academic decisions through data and AI.
          </p>
          <ScrollButton />
        </div>

        {/* Mission & Stats */}
        <div className="mx-auto mb-20 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
          <div className="static-glass-card flex h-full flex-col gap-6 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-brand-navy dark:text-white">Our Mission</h2>
            <div className="min-h-0 flex-1 space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                Coursify was created to address a critical gap in the Queen&apos;s University student experience: the
                lack of comprehensive, accessible data about courses and their historical performance.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                We believe that students should have access to detailed information about courses, including grade
                distributions, professor performance, and peer experiences, to make informed decisions about their
                academic journey.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                By combining official university data with cutting-edge AI technology, we&apos;ve built a platform that
                empowers students to optimize their course selections and academic planning.
              </p>
            </div>
            <div className="shrink-0">
              <Link
                href="/schools/queens"
                className="bg-brand-navy dark:bg-blue-600 inline-block w-full text-center text-white px-7 py-3 rounded-xl font-medium sm:w-auto mt-auto"
              >
                <span className="relative z-10 flex items-center justify-center">
                  Explore Courses
                  <ChevronRight className="ml-2 h-5 w-5" />
                </span>
              </Link>
            </div>
          </div>

          <div className="static-glass-card flex h-full flex-col rounded-2xl p-8">
            <h2 className="mb-6 text-2xl font-bold tracking-tight text-brand-navy dark:text-white">
              Platform Stats
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {(
                [
                  {
                    Icon: BarChart3,
                    value: "500+",
                    label: "Courses Tracked",
                    iconWrap: "bg-brand-navy/10 dark:bg-blue-400/10",
                    iconClass: "text-brand-navy dark:text-blue-400",
                  },
                  {
                    Icon: BarChart3,
                    value: "8+",
                    label: "Semesters of Data",
                    iconWrap: "bg-brand-red/10",
                    iconClass: "text-brand-red",
                  },
                  {
                    Icon: MessageSquare,
                    value: "50+",
                    label: "Departments",
                    iconWrap: "bg-brand-gold/10",
                    iconClass: "text-brand-gold",
                  },
                  {
                    Icon: Brain,
                    value: "1000s",
                    label: "Students Helped",
                    iconWrap: "bg-brand-navy/10 dark:bg-blue-400/10",
                    iconClass: "text-brand-navy dark:text-blue-400",
                  },
                ] satisfies {
                  Icon: LucideIcon
                  value: string
                  label: string
                  iconWrap: string
                  iconClass: string
                }[]
              ).map(({ Icon, value, label, iconWrap, iconClass }) => (
                <div
                  key={label}
                  className="rounded-xl border border-black/[0.06] bg-black/[0.02] p-5 text-center dark:border-white/[0.08] dark:bg-white/[0.04]"
                >
                  <div
                    className={cn(
                      "mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full",
                      iconWrap
                    )}
                  >
                    <Icon className={cn("h-5 w-5", iconClass)} aria-hidden />
                  </div>
                  <p className="text-3xl font-bold tabular-nums tracking-tight text-brand-navy dark:text-white">
                    {value}
                  </p>
                  <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Meet the Team */}
        <div className="relative mb-20 py-2">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-12 top-16 h-72 w-72 rounded-full blur-[140px] opacity-75"
            style={{ background: "radial-gradient(circle, rgba(214,40,57,0.14) 0%, rgba(214,40,57,0.05) 42%, transparent 74%)" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute right-[-2rem] top-24 h-72 w-72 rounded-full blur-[145px] opacity-70"
            style={{ background: "radial-gradient(circle, rgba(0,48,95,0.14) 0%, rgba(0,48,95,0.05) 46%, transparent 76%)" }}
          />
          <div className="relative z-10">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full static-glass-pill mb-4">
                <span className="text-brand-red text-sm font-semibold">Our Team</span>
              </div>
              <h2 className="text-3xl font-bold mb-4 text-brand-navy dark:text-white">Meet the Team</h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                We&apos;re a group of passionate Queen&apos;s students dedicated to improving the academic experience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto py-2">
              <Card className="static-glass-card rounded-2xl border-0 h-full">
                <CardContent className="p-6 h-full">
                  <div className="flex flex-col items-center text-center h-full">
                    <div className="w-20 h-20 bg-gradient-to-br from-brand-navy/80 to-brand-navy rounded-full flex items-center justify-center mb-4 shadow-lg">
                      <span className="text-xl font-bold text-white">AJ</span>
                    </div>
                    <h3 className="text-lg font-bold text-brand-navy dark:text-white">Amaan Javed</h3>
                    <p className="text-brand-red mb-3">Team Lead</p>
                    <p className="mb-4 text-gray-600 dark:text-gray-400 text-sm flex-grow">Queen&apos;s Computing &apos;27</p>
                    <div className="flex space-x-3 mt-auto">
                      <a
                        href="https://github.com/amaanjaved1"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 dark:text-gray-500"
                      >
                        <Github className="h-4 w-4" />
                      </a>
                      <a
                        href="https://www.linkedin.com/in/amaan-javed/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 dark:text-gray-500"
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                      <EmailCopyButton
                        email="amaan.javed@queensu.ca"
                        name="Amaan"
                        className="text-gray-400 dark:text-gray-500"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="static-glass-card rounded-2xl border-0 h-full">
                <CardContent className="p-6 h-full">
                  <div className="flex flex-col items-center text-center h-full">
                    <div className="w-20 h-20 bg-gradient-to-br from-brand-red/80 to-brand-red rounded-full flex items-center justify-center mb-4 shadow-lg">
                      <span className="text-xl font-bold text-white">AA</span>
                    </div>
                    <h3 className="text-lg font-bold text-brand-navy dark:text-white">Aayush Aryal</h3>
                    <p className="text-brand-red mb-3">Lead Web Developer</p>
                    <p className="mb-4 text-gray-600 dark:text-gray-400 text-sm flex-grow">Queen&apos;s Computing &apos;28</p>
                    <div className="flex space-x-3 mt-auto">
                      <a
                        href="https://github.com/aayusha59"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 dark:text-gray-500"
                      >
                        <Github className="h-4 w-4" />
                      </a>
                      <a
                        href="https://www.linkedin.com/in/aayush-aryal1/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 dark:text-gray-500"
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                      <EmailCopyButton
                        email="23wv35@queensu.ca"
                        name="Aayush"
                        className="text-gray-400 dark:text-gray-500"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="relative max-w-5xl mx-auto text-center mb-20 py-2 scroll-mt-24">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-8 h-72 w-72 -translate-x-1/2 rounded-full blur-[145px] opacity-80"
            style={{ background: "radial-gradient(circle, rgba(239,178,21,0.16) 0%, rgba(239,178,21,0.05) 44%, transparent 74%)" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute right-[-1rem] bottom-10 h-64 w-64 rounded-full blur-[140px] opacity-70"
            style={{ background: "radial-gradient(circle, rgba(0,48,95,0.12) 0%, rgba(0,48,95,0.04) 46%, transparent 76%)" }}
          />
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full static-glass-pill mb-4">
              <span className="text-brand-gold text-sm font-semibold">Features</span>
            </div>
            <h2 className="text-3xl font-bold mb-6 text-brand-navy dark:text-white">What Coursify Offers</h2>
            <p className="mb-10 text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Everything you need to make smarter course decisions, all in one place.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-2">
              <div className="static-glass-card rounded-2xl p-6">
                <div className="w-12 h-12 bg-brand-navy/10 dark:bg-blue-400/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-5 w-5 text-brand-navy dark:text-blue-400" />
                </div>
                <h3 className="font-bold text-lg text-brand-navy dark:text-white mb-3">Grade Distributions & Enrollment</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  View historical course grade distributions and enrollment data to understand course difficulty and class sizes before you register.
                </p>
              </div>

              <div className="static-glass-card rounded-2xl p-6">
                <div className="w-12 h-12 bg-brand-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-5 w-5 text-brand-red" />
                </div>
                <h3 className="font-bold text-lg text-brand-navy dark:text-white mb-3">Real Student Comments</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Read past student comments sourced from RateMyProfessors and Reddit to get honest, unfiltered perspectives on courses and professors.
                </p>
              </div>

              <div className="static-glass-card rounded-2xl p-6">
                <div className="w-12 h-12 bg-brand-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-5 w-5 text-brand-gold" />
                </div>
                <h3 className="font-bold text-lg text-brand-navy dark:text-white mb-3">AI Chat Assistant</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Chat with our custom AI trained on real student comments to get instant, personalized answers about any course or professor.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Open Source */}
      <div className="w-full">
        <div className="relative left-1/2 w-[100dvw] -translate-x-1/2 section-glass py-10 sm:py-14 px-4 overflow-hidden">
          <div className="absolute left-[10%] top-10 h-72 w-72 blur-[145px] opacity-80 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,48,95,0.14) 0%, rgba(0,48,95,0.05) 46%, transparent 76%)' }} />
          <div className="absolute right-[10%] bottom-6 h-80 w-80 blur-[155px] opacity-75 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(214,40,57,0.14) 0%, rgba(214,40,57,0.05) 44%, transparent 76%)' }} />
          <div className="container mx-auto px-4 sm:px-6 md:px-8 relative z-10">
            <div className="max-w-2xl mx-auto text-center">
              <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full static-glass-pill mb-4">
                <span className="text-brand-navy dark:text-blue-400 text-sm font-semibold">Open Source</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 leading-tight text-brand-navy dark:text-white">
                Built in the Open
              </h2>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-7 max-w-2xl mx-auto">
                We&apos;ve open-sourced our entire codebase so students can contribute improvements and so other schools can set up a similar platform for their own students.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 mb-7">
                <a
                  href="https://github.com/CoursifyQU/Coursify-WebApp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="liquid-btn-blue text-white px-7 py-3 rounded-xl inline-block font-medium w-full sm:w-auto text-center"
                >
                  <span className="flex items-center justify-center">
                    <Github className="mr-2 h-4 w-4" />
                    <span className="text-sm">Web App</span>
                  </span>
                </a>
                <a
                  href="https://github.com/CoursifyQU/Coursify-Scrapers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="liquid-btn-red text-white px-7 py-3 rounded-xl inline-block font-medium w-full sm:w-auto text-center"
                >
                  <span className="flex items-center justify-center">
                    <Github className="mr-2 h-4 w-4" />
                    <span className="text-sm">Scrapers</span>
                  </span>
                </a>
                <a
                  href="https://github.com/amaanjaved1/Coursify-RAG"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="liquid-btn-gold text-brand-navy dark:text-white px-7 py-3 rounded-xl inline-block font-medium w-full sm:w-auto text-center"
                >
                  <span className="flex items-center justify-center">
                    <Github className="mr-2 h-4 w-4" />
                    <span className="text-sm">RAG</span>
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative border-t border-black/[0.06] dark:border-white/10 py-4 bg-[var(--page-bg)]">
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2">
            <div className="mb-1 md:mb-0">
              <Link href="/" className="inline-flex items-center mb-1 shrink-0">
                <span className="text-sm font-bold tracking-tight text-brand-navy dark:text-white">Cours</span>
                <span className="text-sm font-bold tracking-tight text-brand-red">ify</span>
              </Link>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Platform for{" "}
                <span className="text-brand-navy dark:text-blue-400 font-medium">
                  Queen&apos;s Students
                </span>{" "}
                by{" "}
                <span className="text-brand-navy dark:text-blue-400 font-medium">
                  Queen&apos;s Students
                </span>
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 italic">
                Not affiliated with or endorsed by Queen&apos;s University
              </p>
            </div>

            <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <span className="text-brand-navy dark:text-blue-400 font-medium">
                © {new Date().getFullYear()} Coursify
              </span>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <Link
                href="/about"
                className="text-brand-navy dark:text-blue-400 font-medium"
              >
                About Us
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
