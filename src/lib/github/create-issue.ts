export async function createGitHubIssue(opts: {
  title: string;
  body: string;
  labels: string[];
}): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_REPO_OWNER;
  const repo = process.env.GITHUB_REPO_NAME;

  if (!token || !owner || !repo) {
    console.warn("[github] GITHUB_TOKEN/GITHUB_REPO_OWNER/GITHUB_REPO_NAME not configured; skipping issue creation");
    return;
  }

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify(opts),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`[github] failed to create issue: HTTP ${response.status} — ${text}`);
  }
}
