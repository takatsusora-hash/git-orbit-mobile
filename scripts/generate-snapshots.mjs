import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { parse } from "yaml";

const root = process.cwd();
const configPath = path.join(root, "config", "workspace.config.json");
const outputDir = path.join(root, "public", "data");
const systemsDir = path.join(outputDir, "systems");

function toRelativeTime(iso) {
  const updated = new Date(iso).getTime();
  const diffHours = Math.max(1, Math.round((Date.now() - updated) / 3_600_000));
  if (diffHours < 24) return `${diffHours}h`;
  return `${Math.round(diffHours / 24)}d`;
}

function deriveModuleStatus(progress, checks) {
  if (
    checks.build === "fail" ||
    checks.typecheck === "fail" ||
    checks.test === "fail" ||
    checks.deploy === "fail" ||
    checks.runtime === "fail"
  ) {
    return "broken";
  }
  if (progress <= 15) return "empty";
  if (progress <= 35) return "skeleton";
  if (progress <= 65) return "building";
  if (progress <= 85) return "implemented";
  return "verified";
}

function normalizeProgress(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function assignModuleLayout(modules) {
  const laneX = { ui: -8, api: 0, service: 8, db: 14, external: -14, workflow: 0 };
  const laneZ = { ui: -4, api: 0, service: 4, db: 10, external: 10, workflow: -12 };
  const laneY = { ui: 1, api: 2, service: 1, db: -2, external: -1, workflow: 8 };
  const buckets = new Map();

  for (const module of modules) {
    const entry = buckets.get(module.type) ?? [];
    entry.push(module);
    buckets.set(module.type, entry);
  }

  return modules.map((module) => {
    const group = buckets.get(module.type) ?? [];
    const index = group.findIndex((item) => item.id === module.id);
    const centered = index - (group.length - 1) / 2;
    const wave = (index % 2 === 0 ? 1 : -1) * 1.5;
    return {
      ...module,
      position: [
        laneX[module.type] + centered * 3.8,
        laneY[module.type] + wave,
        laneZ[module.type] + centered * 2.4,
      ],
    };
  });
}

function getGhCliToken() {
  const commands =
    process.platform === "win32"
      ? ["gh.exe", "C:\\Program Files\\GitHub CLI\\gh.exe"]
      : ["gh"];

  for (const command of commands) {
    try {
      return execFileSync(command, ["auth", "token"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
    } catch {
      // Try the next gh path.
    }
  }

  return null;
}

function getToken(config, owner) {
  const account = config.accounts.find((item) => item.id === owner);
  const tokenEnv = account?.tokenEnv;
  if (tokenEnv && process.env[tokenEnv]) return process.env[tokenEnv];
  return process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN ?? getGhCliToken();
}

async function githubJson(owner, endpoint, config) {
  const token = getToken(config, owner);
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "git-orbit-mobile",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`https://api.github.com${endpoint}`, { headers });

  if (!response.ok) {
    throw new Error(`GitHub API ${response.status} for ${owner} ${endpoint}`);
  }

  return response.json();
}

async function fetchRepoSnapshot(owner, name, config) {
  const repo = await githubJson(owner, `/repos/${owner}/${name}`, config);
  const [pulls, issues, runs] = await Promise.all([
    githubJson(owner, `/repos/${owner}/${name}/pulls?state=open&per_page=100`, config),
    githubJson(
      owner,
      `/search/issues?q=${encodeURIComponent(`repo:${owner}/${name} type:issue state:open`)}`,
      config,
    ),
    githubJson(owner, `/repos/${owner}/${name}/actions/runs?per_page=1`, config).catch(() => ({
      workflow_runs: [],
    })),
  ]);

  const latestRun = runs.workflow_runs?.[0];

  return {
    owner,
    name: repo.name,
    branch: repo.default_branch,
    url: repo.html_url,
    isPrivate: repo.private,
    updatedAt: repo.updated_at,
    pushedAt: repo.pushed_at,
    defaultBranch: repo.default_branch,
    openPullRequests: pulls.length,
    openIssues: issues.total_count ?? 0,
    latestWorkflow: latestRun
      ? {
          name: latestRun.name,
          status:
            latestRun.conclusion === "success"
              ? "pass"
              : latestRun.conclusion === "failure" || latestRun.conclusion === "cancelled"
                ? "fail"
                : "unknown",
          url: latestRun.html_url,
        }
      : undefined,
    primaryLanguage: repo.language ?? undefined,
  };
}

async function fetchTopLevelEntries(owner, repo, branch, config) {
  const tree = await githubJson(
    owner,
    `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    config,
  ).catch(() => ({ tree: [] }));
  const topLevel = new Map();
  for (const item of tree.tree ?? []) {
    const head = item.path.split("/")[0];
    if (!head || topLevel.has(head)) continue;
    topLevel.set(head, item.type);
  }
  return Array.from(topLevel.entries()).map(([name, type]) => ({ name, type }));
}

async function repoPathExists(owner, repo, branch, targetPath, config) {
  const endpoint = `/repos/${owner}/${repo}/contents/${targetPath}?ref=${encodeURIComponent(branch)}`;
  const token = getToken(config, owner);
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "git-orbit-mobile",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`https://api.github.com${endpoint}`, { headers });
  return response.ok;
}

async function readYaml(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return parse(raw);
}

async function buildFallbackModules(systemId, repos, config) {
  const modules = [];

  for (const repo of repos) {
    const topLevel = await fetchTopLevelEntries(
      repo.owner,
      repo.name,
      repo.defaultBranch ?? repo.branch ?? "main",
      config,
    ).catch(() => []);

    const entries = topLevel.length ? topLevel : [{ name: repo.name, type: "tree" }];

    entries.slice(0, 12).forEach((entry, index) => {
      const workflowStatus = repo.latestWorkflow?.status ?? "unknown";
      const progress = workflowStatus === "fail" ? 42 : repo.openIssues === 0 ? 84 : 68;
      const normalizedProgress = normalizeProgress(progress);
      const lower = entry.name.toLowerCase();
      const type =
        lower.includes("app") || lower.includes("web") || lower.includes("front")
          ? "ui"
          : lower.includes("api") || lower.includes("server") || lower.includes("backend")
            ? "api"
            : lower.includes("workflow") || lower.includes(".github")
              ? "workflow"
              : lower.includes("db") || lower.includes("data")
                ? "db"
                : "service";
      const checks = {
        exists: true,
        build: workflowStatus === "fail" ? "fail" : "pass",
        typecheck: "unknown",
        test: workflowStatus,
        deploy: workflowStatus,
        runtime: "unknown",
        lastUpdatedAt: toRelativeTime(repo.updatedAt),
      };

      modules.push({
        id: `${repo.owner}-${repo.name}-${entry.name}-${index}`,
        name: entry.name,
        systemId,
        repo: repo.name,
        path: entry.name,
        type,
        progress: normalizedProgress,
        status: deriveModuleStatus(normalizedProgress, checks),
        checks,
        evidence: [
          { type: "artifact", title: `${repo.owner}/${repo.name}`, url: repo.url },
          {
            type: "pr",
            title: `Open PRs: ${repo.openPullRequests}`,
            url: `${repo.url}/pulls`,
            status: repo.openPullRequests > 0 ? "open" : undefined,
          },
          {
            type: "issue",
            title: `Open issues: ${repo.openIssues}`,
            url: `${repo.url}/issues`,
            status: repo.openIssues > 0 ? "open" : undefined,
          },
          ...(repo.latestWorkflow
            ? [
                {
                  type: "action",
                  title: repo.latestWorkflow.name,
                  url: repo.latestWorkflow.url,
                  status:
                    repo.latestWorkflow.status === "pass"
                      ? "pass"
                      : repo.latestWorkflow.status === "fail"
                        ? "fail"
                        : undefined,
                },
              ]
            : []),
        ],
      });
    });
  }

  return assignModuleLayout(modules);
}

async function buildMappedModules(systemId, map, repos, localPath, config) {
  const modules = await Promise.all(
    map.modules.map(async (module) => {
      const repo = repos.find((item) => item.name === module.repo);
      const localExists =
        localPath && existsSync(path.join(root, localPath, module.path));
      const remoteExists =
        repo &&
        (await repoPathExists(
          repo.owner,
          repo.name,
          repo.defaultBranch ?? "main",
          module.path,
          config,
        ).catch(() => false));
      const exists = Boolean(localExists || remoteExists);
      const workflowStatus = repo?.latestWorkflow?.status ?? "unknown";
      const progress =
        (exists ? 25 : 0) +
        (localExists ? 15 : 0) +
        (repo ? 20 : 0) +
        (repo?.openPullRequests ? 10 : 0) +
        (workflowStatus === "pass" ? 25 : workflowStatus === "fail" ? 10 : 15) +
        (repo?.openIssues === 0 ? 10 : 5) +
        (repo?.pushedAt ? 10 : 0);
      const normalizedProgress = normalizeProgress(progress);

      const checks = {
        exists,
        build: workflowStatus === "fail" ? "fail" : repo ? "pass" : "unknown",
        typecheck: workflowStatus,
        test: workflowStatus,
        deploy: workflowStatus,
        runtime: repo?.openIssues === 0 ? "pass" : "unknown",
        lastUpdatedAt: repo ? toRelativeTime(repo.updatedAt) : "—",
      };

      return {
        id: module.id,
        name: module.name,
        systemId,
        repo: module.repo,
        path: module.path,
        type: module.type,
        progress: normalizedProgress,
        status: deriveModuleStatus(normalizedProgress, checks),
        checks,
        evidence: repo
          ? [
              { type: "artifact", title: `${repo.owner}/${repo.name}`, url: repo.url },
              {
                type: "pr",
                title: `Open PRs: ${repo.openPullRequests}`,
                url: `${repo.url}/pulls`,
                status: repo.openPullRequests > 0 ? "open" : undefined,
              },
              {
                type: "issue",
                title: `Open issues: ${repo.openIssues}`,
                url: `${repo.url}/issues`,
                status: repo.openIssues > 0 ? "open" : undefined,
              },
              ...(repo.latestWorkflow
                ? [
                    {
                      type: "action",
                      title: repo.latestWorkflow.name,
                      url: repo.latestWorkflow.url,
                      status:
                        repo.latestWorkflow.status === "pass"
                          ? "pass"
                          : repo.latestWorkflow.status === "fail"
                            ? "fail"
                            : undefined,
                    },
                  ]
                : []),
            ]
          : [],
      };
    }),
  );

  return assignModuleLayout(modules);
}

function buildMappedConnections(map, modules) {
  const moduleById = new Map(modules.map((module) => [module.id, module]));
  return map.connections.map((connection, index) => {
    const from = moduleById.get(connection.from);
    const to = moduleById.get(connection.to);

    let status = "planned";
    if (!from || !to || !from.checks.exists || !to.checks.exists) {
      status = "broken";
    } else if (from.status === "broken" || to.status === "broken") {
      status = "broken";
    } else if (from.checks.test === "pass" && to.checks.test === "pass") {
      status = "active";
    } else {
      status = "untested";
    }

    return {
      id: `${connection.from}-${connection.to}-${index}`,
      from: connection.from,
      to: connection.to,
      kind: connection.kind,
      status,
      strength: connection.strength ?? 0.65,
      evidence: connection.evidence ?? [],
    };
  });
}

function buildFailedSystem(entry, error) {
  const mode = entry.mapFile ? "mapped" : "live";

  return {
    id: entry.id,
    name: entry.name,
    repos: entry.repos.map((name) => ({ owner: entry.owner, name })),
    repoSnapshots: [],
    modules: [
      {
        id: `${entry.id}-unavailable`,
        name: "Snapshot Unavailable",
        systemId: entry.id,
        repo: entry.repos[0] ?? entry.owner,
        path: "snapshot",
        type: "workflow",
    progress: 8,
        status: "broken",
        checks: {
          exists: false,
          build: "fail",
          typecheck: "unknown",
          test: "unknown",
          deploy: "unknown",
          runtime: "unknown",
          lastUpdatedAt: "—",
        },
        evidence: [
          {
            type: "artifact",
            title: error instanceof Error ? error.message : "Snapshot failed",
            url: `https://github.com/${entry.owner}`,
            status: "fail",
          },
        ],
        position: [0, 4, 0],
      },
    ],
    connections: [],
    tags: [...(entry.tags ?? []), "snapshot-error"],
    summary: `${entry.summary ?? "Snapshot build failed."} Current token cannot read this repo or the repo path is wrong.`,
    mode,
    overallStatus: {
      progress: 8,
      errors: 1,
      warnings: 0,
      verifiedModules: 0,
      updatedAt: "—",
    },
  };
}

async function buildSystem(entry, config) {
  const repos = await Promise.all(entry.repos.map((repo) => fetchRepoSnapshot(entry.owner, repo, config)));
  let modules = [];
  let connections = [];
  let mode = "live";

  if (entry.mapFile) {
    const map = await readYaml(path.join(root, "config", "systems", entry.mapFile));
    modules = await buildMappedModules(entry.id, map, repos, entry.localPath, config);
    connections = buildMappedConnections(map, modules);
    mode = "mapped";
  } else {
    modules = await buildFallbackModules(entry.id, repos, config);
  }

  const overallStatus = {
    progress: Math.round(modules.reduce((sum, module) => sum + module.progress, 0) / Math.max(1, modules.length)),
    errors: modules.filter((module) => module.status === "broken").length,
    warnings: connections.filter((connection) => connection.status === "planned" || connection.status === "untested").length,
    verifiedModules: modules.filter((module) => module.status === "verified").length,
    updatedAt: repos[0] ? toRelativeTime(repos[0].updatedAt) : "—",
  };

  return {
    id: entry.id,
    name: entry.name,
    repos: repos.map((repo) => ({ owner: repo.owner, name: repo.name, branch: repo.defaultBranch })),
    repoSnapshots: repos,
    modules,
    connections,
    tags: entry.tags ?? [],
    summary: entry.summary ?? "",
    mode,
    overallStatus,
  };
}

async function main() {
  const config = JSON.parse(await fs.readFile(configPath, "utf8"));
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(systemsDir, { recursive: true });
  await fs.rm(systemsDir, { recursive: true, force: true });
  await fs.mkdir(systemsDir, { recursive: true });

  const accounts = [];
  for (const account of config.accounts) {
    const token = getToken(config, account.id);
    if (!token) {
      accounts.push({
        id: account.id,
        name: account.name,
        repoCount: 0,
        privateCount: 0,
        updatedAt: "—",
        configured: false,
      });
      continue;
    }

    const repos = await githubJson(
      account.id,
      `/users/${account.id}/repos?per_page=100&sort=updated&direction=desc&type=owner`,
      config,
    ).catch(() => []);

    accounts.push({
      id: account.id,
      name: account.name,
      repoCount: repos.length,
      privateCount: repos.filter((repo) => repo.private).length,
      updatedAt: repos[0]?.updated_at ? toRelativeTime(repos[0].updated_at) : "—",
      configured: true,
    });
  }

  const systems = [];
  for (const entry of config.systems) {
    try {
      const system = await buildSystem(entry, config);
      systems.push(system);
      await fs.writeFile(
        path.join(systemsDir, `${entry.id}.json`),
        JSON.stringify(system, null, 2),
      );
    } catch (error) {
      console.error(`Snapshot failed for ${entry.id}`, error);
      const failedSystem = buildFailedSystem(entry, error);
      systems.push(failedSystem);
      await fs.writeFile(
        path.join(systemsDir, `${entry.id}.json`),
        JSON.stringify(failedSystem, null, 2),
      );
    }
  }

  const summaries = systems.map((system) => ({
    id: system.id,
    name: system.name,
    repos: system.repos,
    repoSnapshots: system.repoSnapshots,
    modules: system.modules,
    connections: system.connections,
    tags: system.tags,
    summary: system.summary,
    mode: system.mode,
    overallStatus: system.overallStatus,
  }));

  await fs.writeFile(path.join(outputDir, "accounts.json"), JSON.stringify(accounts, null, 2));
  await fs.writeFile(path.join(outputDir, "systems.json"), JSON.stringify(summaries, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
