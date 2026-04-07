import { Card, CardContent } from "@/components/ui/card"
import {
  Github,
  Linkedin,
  ChevronRight,
  ArrowUpRight,
  BarChart3,
  MessageSquare,
  Brain,
  Sparkles,
  GitCommitHorizontal,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ScrollButton } from "./_components/ScrollButton"
import { EmailCopyButton } from "./_components/EmailCopyButton"
import Footer from "@/components/Footer"
import {
  extractGithubUsername,
  getCommunityContributors,
  type ContributorRepoConfig,
} from "./_lib/community-contributors"

type TeamMember = {
  initials: string
  name: string
  role: string
  details: string
  accent: string
  isMaintainer?: boolean
  github?: string
  linkedin: string
  email?: string
  emailName?: string
}

type OpenSourceRepo = ContributorRepoConfig & {
  buttonClass: string
}

type ContributorHighlight = {
  rowClassName: string
  rankClassName: string
  accentClassName: string
  contributionPrefix: string | null
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

function getMaintainerUsernames(members: readonly TeamMember[]): Set<string> {
  return new Set(
    members
      .filter(({ isMaintainer }) => isMaintainer)
      .map(({ github }) => extractGithubUsername(github))
      .filter((username): username is string => Boolean(username))
  )
}

function formatContributionCount(contributions: number): string {
  return `${contributions} contribution${contributions === 1 ? "" : "s"}`
}

function getContributorFallback(login: string): string {
  return login.slice(0, 2).toUpperCase()
}

function getContributorHighlight(index: number): ContributorHighlight {
  if (index === 0) {
    return {
      rowClassName:
        "border-brand-gold/18 bg-white/[0.6] dark:border-brand-gold/16 dark:bg-white/[0.04]",
      rankClassName:
        "border-brand-gold/24 bg-white/90 text-brand-navy dark:border-brand-gold/18 dark:bg-neutral-900 dark:text-white",
      accentClassName: "bg-brand-gold/55 dark:bg-brand-gold/70",
      contributionPrefix: "🥇",
    }
  }

  if (index === 1) {
    return {
      rowClassName:
        "border-black/[0.08] bg-white/[0.6] dark:border-white/11 dark:bg-white/[0.04]",
      rankClassName:
        "border-black/[0.08] bg-white/90 text-brand-navy dark:border-white/12 dark:bg-neutral-900 dark:text-white",
      accentClassName: "bg-slate-400/55 dark:bg-white/40",
      contributionPrefix: "🥈",
    }
  }

  if (index === 2) {
    return {
      rowClassName:
        "border-amber-500/16 bg-white/[0.6] dark:border-amber-400/14 dark:bg-white/[0.04]",
      rankClassName:
        "border-amber-500/18 bg-white/90 text-brand-navy dark:border-amber-400/16 dark:bg-neutral-900 dark:text-white",
      accentClassName: "bg-amber-500/45 dark:bg-amber-400/55",
      contributionPrefix: "🥉",
    }
  }

  return {
    rowClassName: "border-black/[0.06] bg-white/[0.56] dark:border-white/[0.08] dark:bg-white/[0.03]",
    rankClassName:
      "border-white/80 bg-white/85 text-brand-navy dark:border-white/10 dark:bg-neutral-900 dark:text-white",
    accentClassName: "",
    contributionPrefix: null,
  }
}

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

export default async function About() {
  const maintainerUsernames = getMaintainerUsernames(teamMembers)
  const communityContributors = await getCommunityContributors({
    repos: openSourceRepos,
    maintainers: maintainerUsernames,
  })
  const hasCommunityContributors = communityContributors.length > 0

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
                className="liquid-btn-blue group inline-block w-full text-center text-white px-7 py-3 rounded-xl font-medium sm:w-auto mt-auto"
              >
                <span className="relative z-10 flex items-center justify-center">
                  Explore Courses
                  <ChevronRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform duration-300" />
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

            <div className="mx-auto mt-20 max-w-6xl">
              <div className="relative overflow-hidden rounded-[28px] static-glass-card p-6 sm:p-8">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-10 top-0 h-36 w-36 rounded-full blur-[110px] opacity-75"
                  style={{ background: "radial-gradient(circle, rgba(239,178,21,0.18) 0%, rgba(239,178,21,0.06) 46%, transparent 74%)" }}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute left-[-1rem] bottom-0 h-40 w-40 rounded-full blur-[110px] opacity-70"
                  style={{ background: "radial-gradient(circle, rgba(0,48,95,0.14) 0%, rgba(0,48,95,0.05) 46%, transparent 76%)" }}
                />
                <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
                  <div className="space-y-4">
                    <div className="inline-flex items-center justify-center gap-2 rounded-full static-glass-pill px-4 py-1.5">
                      <GitCommitHorizontal className="h-3.5 w-3.5 text-brand-navy dark:text-white" aria-hidden />
                      <span className="text-sm font-semibold text-brand-navy dark:text-white">Community</span>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold tracking-tight text-brand-navy dark:text-white sm:text-3xl">
                        Community Contributors
                      </h3>
                      <p className="max-w-md text-sm leading-7 text-gray-600 dark:text-gray-400 sm:text-[15px]">
                        {hasCommunityContributors
                          ? "Thanks to these community members for contributing to this open source project."
                          : "No community contributions have landed yet, but we’d love your help building Coursify in the open."}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium uppercase tracking-[0.2em] text-brand-navy/45 dark:text-white/40">
                      {openSourceRepos.map((repo, index) => (
                        <div key={repo.href} className="flex items-center gap-3">
                          {index > 0 ? <span className="h-1 w-1 rounded-full bg-brand-red/45 dark:bg-white/25" /> : null}
                          <span>{repo.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {hasCommunityContributors ? (
                    <div className="relative rounded-[24px] border border-black/[0.06] bg-white/[0.2] p-2 dark:border-white/[0.08] dark:bg-white/[0.02]">
                      <ScrollArea className="h-[24rem]">
                        <div className="relative pr-3">
                          <div
                            aria-hidden
                            className="pointer-events-none absolute left-4 top-4 bottom-4 w-px bg-gradient-to-b from-brand-navy/18 via-brand-red/18 to-brand-gold/24 dark:from-white/16 dark:via-white/10 dark:to-white/18"
                          />
                          <ol className="space-y-3">
                            {communityContributors.map((contributor, index) => (
                              <li key={contributor.login} className="relative">
                                {(() => {
                                  const highlight = getContributorHighlight(index)

                                  return (
                                    <div
                                      className={cn(
                                        "relative flex items-start gap-4 rounded-2xl border px-4 py-4 shadow-sm",
                                        highlight.rowClassName
                                      )}
                                    >
                                      {highlight.contributionPrefix ? (
                                        <div
                                          className={cn(
                                            "absolute inset-y-4 left-0.5 w-1 rounded-full",
                                            highlight.accentClassName
                                          )}
                                          aria-hidden
                                        />
                                      ) : null}
                                      <div
                                        className={cn(
                                          "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold tabular-nums shadow-sm",
                                          highlight.rankClassName
                                        )}
                                      >
                                        {String(index + 1).padStart(2, "0")}
                                      </div>
                                      <div className="flex min-w-0 flex-1 items-start gap-3">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-gradient-to-br from-brand-navy/12 via-white to-brand-red/12 shadow-sm dark:border-white/10 dark:from-brand-navy/18 dark:via-neutral-900 dark:to-brand-red/18">
                                          {contributor.avatarUrl ? (
                                            <img
                                              src={contributor.avatarUrl}
                                              alt={`GitHub avatar for ${contributor.login}`}
                                              className="h-full w-full object-cover"
                                              loading="lazy"
                                            />
                                          ) : (
                                            <span className="text-sm font-semibold text-brand-navy dark:text-white">
                                              {getContributorFallback(contributor.login)}
                                            </span>
                                          )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="min-w-0">
                                              <a
                                                href={contributor.profileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex min-w-0 items-center gap-1.5 font-semibold text-brand-navy dark:text-white"
                                              >
                                                <span className="truncate">@{contributor.login}</span>
                                                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
                                              </a>
                                              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                                Across {contributor.repos.length} public {contributor.repos.length === 1 ? "repository" : "repositories"}
                                              </p>
                                            </div>
                                            <div aria-label={formatContributionCount(contributor.totalContributions)} className="shrink-0 pt-0.5 text-right">
                                              <p className="text-sm font-medium leading-tight tabular-nums text-brand-navy/58 dark:text-white/62">
                                                {highlight.contributionPrefix ? `${highlight.contributionPrefix} ` : null}
                                                {formatContributionCount(contributor.totalContributions)}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="mt-3 flex flex-wrap gap-2">
                                            {contributor.repos.map((repo) => (
                                              <a
                                                key={repo.href}
                                                href={repo.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center rounded-full border border-brand-navy/10 bg-brand-navy/[0.05] px-2.5 py-1 text-[11px] font-medium text-brand-navy dark:border-white/10 dark:bg-white/[0.05] dark:text-white/80"
                                              >
                                                {repo.label}
                                              </a>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })()}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </ScrollArea>
                    </div>
                  ) : (
                    <div className="relative overflow-hidden rounded-2xl border border-dashed border-brand-navy/15 bg-white/[0.42] px-6 py-6 dark:border-white/10 dark:bg-white/[0.03]">
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-brand-navy via-brand-red to-brand-gold"
                      />
                      <div className="pl-4">
                        <p className="text-lg font-semibold text-brand-navy dark:text-white">
                          No community contributions yet. We&apos;d love your help.
                        </p>
                        <p className="mt-2 max-w-lg text-sm leading-7 text-gray-600 dark:text-gray-400">
                          Browse one of our public repositories and be the first community contributor to land a change.
                        </p>
                        <div className="mt-5 flex flex-wrap gap-2">
                          {openSourceRepos.map((repo) => (
                            <a
                              key={repo.href}
                              href={repo.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-full border border-brand-navy/12 bg-brand-navy/[0.05] px-3 py-1.5 text-sm font-medium text-brand-navy dark:border-white/10 dark:bg-white/[0.05] dark:text-white/85"
                            >
                              {repo.label}
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
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
