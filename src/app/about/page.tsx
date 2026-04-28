import { Card, CardContent } from "@/components/ui/card"
import {
  Github,
  Linkedin,
  BarChart3,
  MessageSquare,
  Brain,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import type { LucideIcon } from "lucide-react"
import { EmailCopyButton } from "./_components/email-copy-button"
import { CommunityContributors } from "./_components/community-contributors"
import Footer from "@/components/footer"
import type { ContributorRepoConfig } from "./_lib/community-contributors"
import type { TeamMember } from "./_types"

type OpenSourceRepo = ContributorRepoConfig & {
  buttonClass: string
}

const teamMembers: readonly TeamMember[] = [
  {
    initials: "AJ",
    name: "Amaan Javed",
    role: "Team Lead",
    details: "Queen's Computing '27",
    accent: "from-brand-navy/80 to-brand-navy",
    isMaintainer: true,
    github: "https://github.com/amaanjaved1",
    linkedin: "https://www.linkedin.com/in/amaan-javed/",
    email: "amaan.javed@queensu.ca",
    emailName: "Amaan",
  },
  {
    initials: "AA",
    name: "Aayush Aryal",
    role: "Lead Web Developer",
    details: "Queen's Computing '28",
    accent: "from-brand-red/80 to-brand-red",
    isMaintainer: true,
    github: "https://github.com/aayusha59",
    linkedin: "https://www.linkedin.com/in/aayush-aryal1/",
    email: "23wv35@queensu.ca",
    emailName: "Aayush",
  },
  {
    initials: "HK",
    name: "Hiba Khurram",
    role: "Marketing & Outreach",
    details: "Queen's Computing '28",
    accent: "from-brand-navy/70 to-brand-red/80",
    linkedin: "https://www.linkedin.com/in/hiba-khurram-6999612aa/",
    email: "23cm46@queensu.ca",
    emailName: "Hiba Khurram",
  },
] as const

const featuredTeamMembers = teamMembers.slice(0, 2)
const supportingTeamMembers = teamMembers.slice(2)

const openSourceRepos: readonly OpenSourceRepo[] = [
  {
    owner: "CoursifyQU",
    repo: "Coursify-WebApp",
    href: "https://github.com/CoursifyQU/Coursify-WebApp",
    label: "Web App",
    buttonClass: "liquid-btn-blue text-white px-7 py-3 rounded-xl inline-block font-medium w-full sm:w-auto text-center",
  },
  {
    owner: "CoursifyQU",
    repo: "Coursify-Scrapers",
    href: "https://github.com/CoursifyQU/Coursify-Scrapers",
    label: "Scrapers",
    buttonClass: "liquid-btn-red text-white px-7 py-3 rounded-xl inline-block font-medium w-full sm:w-auto text-center",
  },
  {
    owner: "amaanjaved1",
    repo: "Coursify-RAG",
    href: "https://github.com/amaanjaved1/Coursify-RAG",
    label: "RAG",
    buttonClass: "liquid-btn-gold text-brand-navy dark:text-white px-7 py-3 rounded-xl inline-block font-medium w-full sm:w-auto text-center",
  },
] as const

function renderTeamMemberCard({
  initials,
  name,
  role,
  details,
  accent,
  github,
  linkedin,
  email,
  emailName,
}: TeamMember) {
  return (
    <Card key={name} className="glass-card rounded-2xl border-0 h-full">
      <CardContent className="p-6 h-full">
        <div className="flex flex-col items-center text-center h-full">
          <div
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-lg bg-gradient-to-br",
              accent
            )}
          >
            <span className="text-xl font-bold text-white">{initials}</span>
          </div>
          <h3 className="text-lg font-bold text-brand-navy dark:text-white">{name}</h3>
          <p className="text-brand-red mb-3">{role}</p>
          <p className="mb-4 text-gray-600 dark:text-gray-400 text-sm flex-grow">{details}</p>
          <div className="flex space-x-3 mt-auto">
            {github ? (
              <a
                href={github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`GitHub profile for ${name}`}
                className="text-gray-400 dark:text-gray-500 hover:text-brand-navy dark:hover:text-blue-400 transition-colors duration-300"
              >
                <Github className="h-4 w-4" />
              </a>
            ) : null}
            <a
              href={linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`LinkedIn profile for ${name}`}
              className="text-gray-400 dark:text-gray-500 hover:text-brand-navy dark:hover:text-blue-400 transition-colors duration-300"
            >
              <Linkedin className="h-4 w-4" />
            </a>
            {email && emailName ? <EmailCopyButton email={email} name={emailName} /> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function About() {
  return (
    <div className="relative min-h-screen overflow-x-clip pt-20">
      <div className="container pt-12 pb-0 px-4 md:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="relative mb-20 max-w-3xl mx-auto text-center">
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
<p className="text-xl text-muted-foreground mb-6">
            Coursify was created to address a critical gap in the Queen&apos;s University student experience: the
            lack of comprehensive, accessible data about courses and their historical performance.
          </p>
        </div>

        {/* Support & Stats */}
        <div className="mx-auto mb-20 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
          <div className="static-glass-card flex flex-col gap-4 rounded-2xl p-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full static-glass-pill self-start">
              <span className="text-sm font-semibold text-brand-navy dark:text-white">Support Us</span>
              <span className="text-base leading-none">☕</span>
            </div>
            <h2 className="text-2xl font-bold text-brand-navy dark:text-white">Buy Us a Coffee</h2>
            <p className="text-gray-700 dark:text-gray-300 flex-grow">
              We wanted to make Coursify completely free. That being said, keeping the servers running and the
              data fresh does cost money. If Coursify has helped you navigate your courses, even a small contribution
              goes a long way. Donations are handled securely through Buy Me a Coffee.
            </p>
            <div className="mt-auto">
              <a
                href="https://www.buymeacoffee.com/amaanjaved"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl font-medium bg-[#FFDD00] hover:bg-[#FFDD00]/90 text-gray-900 transition-colors duration-200"
              >
                <Image src="/bmc-logo.svg" alt="" width={14} height={20} />
                Donate to Coursify
              </a>
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
                    value: "1,600+",
                    label: "Courses Tracked",
                    iconWrap: "bg-brand-navy/10 dark:bg-blue-400/10",
                    iconClass: "text-brand-navy dark:text-blue-400",
                  },
                  {
                    Icon: BarChart3,
                    value: "17",
                    label: "Semesters of Data",
                    iconWrap: "bg-brand-red/10",
                    iconClass: "text-brand-red",
                  },
                  {
                    Icon: MessageSquare,
                    value: "9",
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

            <div className="grid grid-cols-1 gap-6 max-w-4xl mx-auto py-2 md:grid-cols-2">
              {featuredTeamMembers.map(renderTeamMemberCard)}
            </div>

            <div
              className={cn(
                "grid grid-cols-1 gap-6 mx-auto pt-6",
                supportingTeamMembers.length === 1
                  ? "max-w-md"
                  : "max-w-6xl md:grid-cols-2 xl:grid-cols-3"
              )}
            >
              {supportingTeamMembers.map(renderTeamMemberCard)}
            </div>

            <CommunityContributors repos={openSourceRepos} teamMembers={teamMembers} />
          </div>
        </div>
      </div>

      {/* Open Source */}
      <div className="w-full">
        <div className="relative left-1/2 w-[100dvw] -translate-x-1/2 section-glass py-8 sm:py-10 px-4 overflow-hidden">
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
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
                We&apos;ve open-sourced our entire codebase so students can contribute improvements and so other schools can set up a similar platform for their own students.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3">
                {openSourceRepos.map((repo) => (
                  <a
                    key={repo.href}
                    href={repo.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={repo.buttonClass}
                  >
                    <span className="flex items-center justify-center">
                      <Github className="mr-2 h-4 w-4" />
                      <span className="text-sm">{repo.label}</span>
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
