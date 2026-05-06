import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { RepoSnapshot } from "@/lib/types";

const execFileAsync = promisify(execFile);
const responseCache = new Map<string, { expiresAt: number; value: unknown }>();

async function runGhJson<T>(owner: string, args: string[]) {
  const cacheKey = `${owner}:${args.join(" ")}`;
  const cached = responseCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value as T;
  }

  await execFileAsync("gh", ["auth", "switch", "-u", owner]);
  const { stdout } = await execFileAsync("gh", args, {
    maxBuffer: 1024 * 1024 * 4,
  });
  const payload = JSON.parse(stdout) as T;

  responseCache.set(cacheKey, {
    expiresAt: Date.now() + 120_000,
    value: payload,
  });

  return payload;
}

type GitHubRepo = {
  name: string;
  url?: string;
  html_url?: string;
  isPrivate?: boolean;
  private?: boolean;
  updatedAt?: string;
  updated_at?: string;
  pushedAt?: string;
  pushed_at?: string;
  defaultBranchRef?: {
    name: string;
  };
  default_branch?: string;
  primaryLanguage?: {
    name: string;
  } | null;
  language?: string | null;
};

type GitHubWorkflowRuns = {
  workflow_runs: Array<{
    name: string;
    html_url: string;
    conclusion: "success" | "failure" | "cancelled" | null;
  }>;
};

type GitHubSearchIssues = {
  total_count: number;
};

type GitHubTree = {
  tree: Array<{
    path: string;
    type: "tree" | "blob";
  }>;
};

export async function fetchOwnerRepos(owner: string) {
  return runGhJson<GitHubRepo[]>(owner, [
    "repo",
    "list",
    owner,
    "--limit",
    "100",
    "--json",
    "name,isPrivate,updatedAt",
  ]);
}

export async function fetchRepoSnapshot(
  owner: string,
  name: string,
): Promise<RepoSnapshot> {
  const repo = await runGhJson<GitHubRepo>(owner, [
    "repo",
    "view",
    `${owner}/${name}`,
    "--json",
    "name,url,isPrivate,updatedAt,pushedAt,defaultBranchRef,primaryLanguage",
  ]);

  const pulls = await runGhJson<Array<{ number: number }>>(owner, [
    "api",
    `repos/${owner}/${name}/pulls?state=open&per_page=100`,
  ]);

  const issues = await runGhJson<GitHubSearchIssues>(owner, [
    "api",
    `search/issues?q=repo:${owner}/${name}+type:issue+state:open`,
  ]);

  const workflowRuns = await runGhJson<GitHubWorkflowRuns>(owner, [
    "api",
    `repos/${owner}/${name}/actions/runs?per_page=1`,
  ]).catch(() => ({ workflow_runs: [] }));

  const latestRun = workflowRuns.workflow_runs[0];
  const latestWorkflow = latestRun
    ? {
        name: latestRun.name,
        status: (
          latestRun.conclusion === "success"
            ? "pass"
            : latestRun.conclusion === "failure" || latestRun.conclusion === "cancelled"
              ? "fail"
              : "unknown"
        ) as "pass" | "fail" | "unknown",
        url: latestRun.html_url,
      }
    : undefined;

  return {
    owner,
    name: repo.name,
    branch: repo.defaultBranchRef?.name,
    url: repo.url ?? repo.html_url ?? `https://github.com/${owner}/${name}`,
    isPrivate: repo.isPrivate ?? repo.private ?? true,
    updatedAt: repo.updatedAt ?? repo.updated_at ?? new Date().toISOString(),
    pushedAt: repo.pushedAt ?? repo.pushed_at,
    defaultBranch: repo.defaultBranchRef?.name ?? repo.default_branch,
    openPullRequests: pulls.length,
    openIssues: issues.total_count,
    latestWorkflow,
    primaryLanguage: repo.primaryLanguage?.name ?? repo.language ?? undefined,
  };
}

export async function repoPathExists(
  owner: string,
  repo: string,
  branch: string | undefined,
  targetPath: string,
) {
  const endpoint = branch
    ? `repos/${owner}/${repo}/contents/${targetPath}?ref=${encodeURIComponent(branch)}`
    : `repos/${owner}/${repo}/contents/${targetPath}`;

  const result = await runGhJson<unknown>(owner, ["api", endpoint]).catch(() => null);
  return Boolean(result);
}

export async function fetchRepoTopLevelEntries(
  owner: string,
  repo: string,
  branch: string | undefined,
) {
  const ref = branch ?? "main";
  const tree = await runGhJson<GitHubTree>(owner, [
    "api",
    `repos/${owner}/${repo}/git/trees/${ref}?recursive=1`,
  ]).catch(() => ({ tree: [] }));

  const topLevel = new Map<string, "tree" | "blob">();
  for (const item of tree.tree) {
    const [head] = item.path.split("/");
    if (!head || topLevel.has(head)) continue;
    topLevel.set(head, item.type);
  }

  return Array.from(topLevel.entries()).map(([name, type]) => ({ name, type }));
}
