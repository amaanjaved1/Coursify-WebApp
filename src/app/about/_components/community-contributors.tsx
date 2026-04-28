import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowUpRight, GitCommitHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getCommunityContributors,
  extractGithubUsername,
  type ContributorRepoConfig,
} from "../_lib/community-contributors"
import type { TeamMember } from "../_types"

type Props = {
  repos: readonly ContributorRepoConfig[]
  teamMembers: readonly TeamMember[]
}

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

function getContributorHighlight(index: number) {
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
    rowClassName:
      "border-black/[0.06] bg-white/[0.56] dark:border-white/[0.08] dark:bg-white/[0.03]",
    rankClassName:
      "border-white/80 bg-white/85 text-brand-navy dark:border-white/10 dark:bg-neutral-900 dark:text-white",
    accentClassName: "",
    contributionPrefix: null,
  }
}

export async function CommunityContributors({ repos, teamMembers }: Props) {
  const maintainerUsernames = getMaintainerUsernames(teamMembers)
  const communityContributors = await getCommunityContributors({
    repos,
    maintainers: maintainerUsernames,
  })
  const hasCommunityContributors = communityContributors.length > 0

  return (
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
                  : "No community contributions have landed yet, but we'd love your help building Coursify in the open."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium uppercase tracking-[0.2em] text-brand-navy/45 dark:text-white/40">
              {repos.map((repo, index) => (
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
                    {communityContributors.map((contributor, index) => {
                      const highlight = getContributorHighlight(index)
                      return (
                        <li key={contributor.login} className="relative">
                          <div
                            className={cn(
                              "relative flex items-start gap-4 rounded-2xl border px-4 py-4 shadow-sm max-[390px]:gap-3",
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
                            <div className="flex w-14 shrink-0 flex-col items-center gap-2.5 max-[390px]:w-12 max-[390px]:gap-2 sm:w-auto sm:flex-row sm:items-start sm:gap-3">
                              <div
                                className={cn(
                                  "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold tabular-nums shadow-sm",
                                  highlight.rankClassName
                                )}
                              >
                                {String(index + 1).padStart(2, "0")}
                              </div>
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-gradient-to-br from-brand-navy/12 via-white to-brand-red/12 shadow-sm max-[390px]:h-10 max-[390px]:w-10 dark:border-white/10 dark:from-brand-navy/18 dark:via-neutral-900 dark:to-brand-red/18">
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
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                                <div className="min-w-0">
                                  <a
                                    href={contributor.profileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex min-w-0 max-w-full items-center gap-1.5 font-semibold text-brand-navy dark:text-white"
                                  >
                                    <span className="truncate text-[clamp(1.05rem,4.6vw,1.8rem)] max-[390px]:text-[clamp(0.95rem,4.2vw,1.1rem)] sm:text-base">
                                      @{contributor.login}
                                    </span>
                                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
                                  </a>
                                  <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
                                    Across {contributor.repos.length} public {contributor.repos.length === 1 ? "repository" : "repositories"}
                                  </p>
                                </div>
                                <div
                                  aria-label={formatContributionCount(contributor.totalContributions)}
                                  className="shrink-0 pt-0 text-left sm:pt-0.5 sm:text-right"
                                >
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
                        </li>
                      )
                    })}
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
                  {repos.map((repo) => (
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
  )
}
