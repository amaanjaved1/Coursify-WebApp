const GITHUB_API_BASE_URL = "https://api.github.com"
const GITHUB_API_VERSION = "2022-11-28"
const CONTRIBUTORS_PER_PAGE = 100
const CONTRIBUTORS_REVALIDATE_SECONDS = 3600

export type ContributorRepoConfig = {
  owner: string
  repo: string
  href: string
  label: string
}

export type GithubContributorApiRecord = {
  login?: string | null
  contributions?: number
  html_url?: string | null
  avatar_url?: string | null
  type?: string | null
}

export type CommunityContributor = {
  login: string
  profileUrl: string
  avatarUrl: string | null
  totalContributions: number
  repos: ContributorRepoConfig[]
}

type GetCommunityContributorsOptions = {
  repos: readonly ContributorRepoConfig[]
  maintainers: Iterable<string>
  limit?: number
}

type AggregatedContributor = CommunityContributor & {
  repoKeys: Set<string>
}

function getGithubHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
  }

  const githubToken = process.env.GITHUB_TOKEN?.trim()
  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`
  }

  return headers
}

function isGithubContributorApiRecord(value: unknown): value is GithubContributorApiRecord {
  if (!value || typeof value !== "object") {
    return false
  }

  const contributor = value as GithubContributorApiRecord
  const hasLogin = typeof contributor.login === "string" && contributor.login.length > 0
  const hasProfileUrl = typeof contributor.html_url === "string" && contributor.html_url.length > 0
  const hasContributions = typeof contributor.contributions === "number"
  const isHumanUser = contributor.type === undefined || contributor.type === null || contributor.type === "User"

  return hasLogin && hasProfileUrl && hasContributions && isHumanUser
}

function getRepoKey(repo: Pick<ContributorRepoConfig, "owner" | "repo">): string {
  return `${repo.owner}/${repo.repo}`
}

async function fetchRepoContributors(repo: ContributorRepoConfig): Promise<GithubContributorApiRecord[]> {
  const contributors: GithubContributorApiRecord[] = []

  for (let page = 1; ; page += 1) {
    const params = new URLSearchParams({
      per_page: String(CONTRIBUTORS_PER_PAGE),
      page: String(page),
    })

    const response = await fetch(
      `${GITHUB_API_BASE_URL}/repos/${repo.owner}/${repo.repo}/contributors?${params.toString()}`,
      {
        headers: getGithubHeaders(),
        next: { revalidate: CONTRIBUTORS_REVALIDATE_SECONDS },
      }
    )

    if (!response.ok) {
      throw new Error(
        `Failed to fetch contributors for ${getRepoKey(repo)}: ${response.status} ${response.statusText}`
      )
    }

    const payload = (await response.json()) as unknown
    if (!Array.isArray(payload)) {
      throw new Error(`Unexpected contributors payload for ${getRepoKey(repo)}`)
    }

    const pageContributors = payload.filter(isGithubContributorApiRecord)
    contributors.push(...pageContributors)

    if (pageContributors.length < CONTRIBUTORS_PER_PAGE) {
      break
    }
  }

  return contributors
}

export function extractGithubUsername(githubUrl?: string | null): string | null {
  if (!githubUrl) {
    return null
  }

  try {
    const pathname = new URL(githubUrl).pathname.replace(/^\/+|\/+$/g, "")
    if (!pathname) {
      return null
    }

    const [username] = pathname.split("/")
    return username ? username.toLowerCase() : null
  } catch {
    return null
  }
}

export async function getCommunityContributors({
  repos,
  maintainers,
  limit,
}: GetCommunityContributorsOptions): Promise<CommunityContributor[]> {
  const maintainerSet = new Set(
    Array.from(maintainers, (maintainer) => maintainer.toLowerCase()).filter(Boolean)
  )

  const results = await Promise.allSettled(repos.map((repo) => fetchRepoContributors(repo)))
  const contributorsByLogin = new Map<string, AggregatedContributor>()

  let hasSuccessfulFetch = false

  results.forEach((result, index) => {
    const repo = repos[index]

    if (result.status !== "fulfilled") {
      console.error(`Unable to load contributors for ${getRepoKey(repo)}:`, result.reason)
      return
    }

    hasSuccessfulFetch = true

    result.value.forEach((contributor) => {
      if (!contributor.login || !contributor.html_url || typeof contributor.contributions !== "number") {
        return
      }

      const normalizedLogin = contributor.login.toLowerCase()
      if (maintainerSet.has(normalizedLogin)) {
        return
      }

      const repoKey = getRepoKey(repo)
      const existingContributor = contributorsByLogin.get(normalizedLogin)

      if (existingContributor) {
        existingContributor.totalContributions += contributor.contributions
        if (!existingContributor.repoKeys.has(repoKey)) {
          existingContributor.repoKeys.add(repoKey)
          existingContributor.repos.push(repo)
        }
        return
      }

      contributorsByLogin.set(normalizedLogin, {
        login: contributor.login,
        profileUrl: contributor.html_url,
        avatarUrl: contributor.avatar_url ?? null,
        totalContributions: contributor.contributions,
        repos: [repo],
        repoKeys: new Set([repoKey]),
      })
    })
  })

  if (!hasSuccessfulFetch) {
    return []
  }

  const sortedContributors = Array.from(contributorsByLogin.values())
    .map(({ repoKeys: _repoKeys, ...contributor }) => contributor)
    .sort((left, right) => {
      if (right.totalContributions !== left.totalContributions) {
        return right.totalContributions - left.totalContributions
      }

      return left.login.localeCompare(right.login)
    })

  return typeof limit === "number" ? sortedContributors.slice(0, limit) : sortedContributors
}
