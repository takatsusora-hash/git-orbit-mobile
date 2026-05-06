import { promises as fs } from "node:fs";
import { existsSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import type {
  Module,
  ModuleConnection,
  RepoSnapshot,
  System,
  SystemMapFile,
  WorkspaceConfig,
} from "@/lib/types";
import { assignModuleLayout } from "@/lib/viewer/layout3d";
import { deriveModuleStatus } from "./progressScorer";
import {
  fetchOwnerRepos,
  fetchRepoSnapshot,
  fetchRepoTopLevelEntries,
  repoPathExists,
} from "@/lib/github/liveData";

const rootDir = process.cwd();

async function readJson<T>(filePath: string) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

async function readYaml<T>(filePath: string) {
  const raw = await fs.readFile(filePath, "utf8");
  return parse(raw) as T;
}

export async function loadWorkspaceConfig() {
  return readJson<WorkspaceConfig>(
    path.join(rootDir, "config", "workspace.config.json"),
  );
}

function toRelativeTime(iso: string) {
  const updated = new Date(iso).getTime();
  const diffHours = Math.max(1, Math.round((Date.now() - updated) / 3_600_000));
  if (diffHours < 24) return `${diffHours}h`;
  return `${Math.round(diffHours / 24)}d`;
}

async function buildFallbackModules(systemId: string, repos: RepoSnapshot[]): Promise<Module[]> {
  const modules: Module[] = [];

  for (const repo of repos) {
    const topLevel = await fetchRepoTopLevelEntries(
      repo.owner,
      repo.name,
      repo.defaultBranch,
    ).catch(() => []);

    const entries = topLevel.length > 0 ? topLevel : [{ name: repo.name, type: "tree" as const }];

    entries.slice(0, 12).forEach((entry, index) => {
      const workflowStatus = repo.latestWorkflow?.status ?? "unknown";
      const progress = workflowStatus === "fail" ? 42 : repo.openIssues === 0 ? 84 : 68;
      const checks = {
        exists: true,
        build: workflowStatus === "fail" ? "fail" : "pass",
        typecheck: "unknown",
        test: workflowStatus,
        deploy: workflowStatus,
        runtime: "unknown",
        lastUpdatedAt: toRelativeTime(repo.updatedAt),
      } as const;

      const lower = entry.name.toLowerCase();
      const moduleType =
        lower.includes("app") || lower.includes("web") || lower.includes("front")
          ? "ui"
          : lower.includes("api") || lower.includes("server") || lower.includes("backend")
            ? "api"
            : lower.includes("workflow") || lower.includes(".github")
              ? "workflow"
              : lower.includes("db") || lower.includes("data")
                ? "db"
                : "service";

      modules.push({
        id: `${repo.owner}-${repo.name}-${entry.name}-${index}`,
        name: entry.name,
        systemId,
        repo: repo.name,
        path: entry.name,
        type: moduleType,
        progress,
        status: deriveModuleStatus(progress, checks),
        checks,
        evidence: [
          {
            type: "artifact",
            title: `${repo.owner}/${repo.name}`,
            url: repo.url,
          },
                {
                  type: "pr",
                  title: `Open PRs: ${repo.openPullRequests}`,
                  url: `${repo.url}/pulls`,
                  status: repo.openPullRequests > 0 ? ("open" as const) : undefined,
                },
                {
                  type: "issue",
                  title: `Open issues: ${repo.openIssues}`,
                  url: `${repo.url}/issues`,
                  status: repo.openIssues > 0 ? ("open" as const) : undefined,
                },
          ...(repo.latestWorkflow
            ? [
                {
                  type: "action" as const,
                  title: repo.latestWorkflow.name,
                  url: repo.latestWorkflow.url,
                  status:
                    repo.latestWorkflow.status === "pass"
                      ? ("pass" as const)
                      : repo.latestWorkflow.status === "fail"
                        ? ("fail" as const)
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

async function buildMappedModules(
  systemId: string,
  map: SystemMapFile,
  repoSnapshots: RepoSnapshot[],
  localPath?: string,
) {
  const modules = await Promise.all(
    map.modules.map(async (module) => {
      const repo = repoSnapshots.find((item) => item.name === module.repo);
      const localExists =
        localPath && repo
          ? existsSync(path.join(rootDir, localPath, module.path))
          : false;
      const remoteExists = repo
        ? await repoPathExists(repo.owner, repo.name, repo.defaultBranch, module.path).catch(
            () => false,
          )
        : false;
      const exists = localExists || remoteExists;
      const workflowStatus = repo?.latestWorkflow?.status ?? "unknown";
      const progress =
        (exists ? 25 : 0) +
        (localExists ? 15 : 0) +
        (repo ? 20 : 0) +
        (repo?.openPullRequests ? 10 : 0) +
        (workflowStatus === "pass" ? 25 : workflowStatus === "fail" ? 10 : 15) +
        (repo?.openIssues === 0 ? 10 : 5) +
        (repo?.pushedAt ? 10 : 0);
      const checks = {
        exists,
        build: workflowStatus === "fail" ? "fail" : repo ? "pass" : "unknown",
        typecheck: workflowStatus,
        test: workflowStatus,
        deploy: workflowStatus,
        runtime: repo?.openIssues === 0 ? "pass" : "unknown",
        lastUpdatedAt: repo ? toRelativeTime(repo.updatedAt) : "—",
      } as const;

      return {
        id: module.id,
        name: module.name,
        systemId,
        repo: module.repo,
        path: module.path,
        type: module.type,
        progress,
        status: deriveModuleStatus(progress, checks),
        checks,
        evidence: [
          ...(repo
            ? [
                {
                  type: "artifact" as const,
                  title: `${repo.owner}/${repo.name}`,
                  url: repo.url,
                },
                {
                  type: "pr" as const,
                  title: `Open PRs: ${repo.openPullRequests}`,
                  url: `${repo.url}/pulls`,
                  status: repo.openPullRequests > 0 ? ("open" as const) : undefined,
                },
                {
                  type: "issue" as const,
                  title: `Open issues: ${repo.openIssues}`,
                  url: `${repo.url}/issues`,
                  status: repo.openIssues > 0 ? ("open" as const) : undefined,
                },
                ...(repo.latestWorkflow
                  ? [
                      {
                        type: "action" as const,
                        title: repo.latestWorkflow.name,
                        url: repo.latestWorkflow.url,
                        status:
                          repo.latestWorkflow.status === "pass"
                            ? ("pass" as const)
                            : repo.latestWorkflow.status === "fail"
                              ? ("fail" as const)
                              : undefined,
                      },
                    ]
                  : []),
              ]
            : []),
        ],
      };
    }),
  );

  return assignModuleLayout(modules);
}

function buildMappedConnections(map: SystemMapFile, modules: Module[]): ModuleConnection[] {
  const moduleById = new Map(modules.map((module) => [module.id, module]));

  return map.connections.map((connection, index) => {
    const from = moduleById.get(connection.from);
    const to = moduleById.get(connection.to);

    let status: ModuleConnection["status"] = "planned";
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

export async function loadSystem(systemId: string): Promise<System | null> {
  const workspace = await loadWorkspaceConfig();
  const entry = workspace.systems.find((item) => item.id === systemId);

  if (!entry) {
    return null;
  }

  const repoSnapshots = await Promise.all(
    entry.repos.map((repoName) => fetchRepoSnapshot(entry.owner, repoName)),
  );

  let modules: Module[] = [];
  let connections: ModuleConnection[] = [];
  let mode: System["mode"] = "live";

  if (entry.mapFile) {
    const map = await readYaml<SystemMapFile>(
      path.join(rootDir, "config", "systems", entry.mapFile),
    );
      modules = await buildMappedModules(systemId, map, repoSnapshots, entry.localPath);
      connections = buildMappedConnections(map, modules);
      mode = "mapped";
    } else {
    modules = await buildFallbackModules(systemId, repoSnapshots);
  }

  const errors = modules.filter((module) => module.status === "broken").length;
  const warnings = connections.filter(
    (connection) =>
      connection.status === "planned" || connection.status === "untested",
  ).length;
  const verifiedModules = modules.filter(
    (module) => module.status === "verified",
  ).length;
  const progress = Math.round(
    modules.reduce((sum, module) => sum + module.progress, 0) /
      Math.max(1, modules.length),
  );

  return {
    id: systemId,
    name: entry.name,
    repos: repoSnapshots.map((repo) => ({
      owner: repo.owner,
      name: repo.name,
      branch: repo.defaultBranch,
    })),
    repoSnapshots,
    modules,
    connections,
    tags: entry.tags ?? [],
    summary: entry.summary ?? "",
    mode,
    overallStatus: {
      progress,
      errors,
      warnings,
      verifiedModules,
      updatedAt: repoSnapshots[0] ? toRelativeTime(repoSnapshots[0].updatedAt) : "—",
    },
  };
}

async function loadSystemSummary(systemId: string): Promise<System | null> {
  const workspace = await loadWorkspaceConfig();
  const entry = workspace.systems.find((item) => item.id === systemId);

  if (!entry) {
    return null;
  }

  const repoSnapshots = await Promise.all(
    entry.repos.map((repoName) => fetchRepoSnapshot(entry.owner, repoName)),
  );

  const modules = await buildFallbackModules(systemId, repoSnapshots);
  const progress = Math.round(
    modules.reduce((sum, module) => sum + module.progress, 0) /
      Math.max(1, modules.length),
  );

  return {
    id: systemId,
    name: entry.name,
    repos: repoSnapshots.map((repo) => ({
      owner: repo.owner,
      name: repo.name,
      branch: repo.defaultBranch,
    })),
    repoSnapshots,
    modules,
    connections: [],
    tags: entry.tags ?? [],
    summary: entry.summary ?? "",
    mode: entry.mapFile ? "mapped" : "live",
    overallStatus: {
      progress,
      errors: modules.filter((module) => module.status === "broken").length,
      warnings: 0,
      verifiedModules: modules.filter((module) => module.status === "verified").length,
      updatedAt: repoSnapshots[0] ? toRelativeTime(repoSnapshots[0].updatedAt) : "—",
    },
  };
}

export async function loadAllSystems() {
  const workspace = await loadWorkspaceConfig();
  const systems: Array<System | null> = [];
  for (const system of workspace.systems) {
    try {
      systems.push(await loadSystem(system.id));
    } catch (error) {
      console.error(`Failed to load system ${system.id}`, error);
      systems.push(null);
    }
  }

  return systems.filter((system): system is System => Boolean(system));
}

export async function loadSystemSummaries() {
  const workspace = await loadWorkspaceConfig();
  const systems: Array<System | null> = [];

  for (const system of workspace.systems) {
    try {
      systems.push(await loadSystemSummary(system.id));
    } catch (error) {
      console.error(`Failed to load summary ${system.id}`, error);
      systems.push(null);
    }
  }

  return systems.filter((system): system is System => Boolean(system));
}

export async function loadAccountSummaries() {
  const workspace = await loadWorkspaceConfig();
  const accounts = [];

  for (const account of workspace.accounts) {
    const repos = await fetchOwnerRepos(account.id).catch(() => []);
    accounts.push({
      id: account.id,
      name: account.name,
      repoCount: repos.length,
      privateCount: repos.filter((repo) => repo.isPrivate ?? repo.private).length,
      updatedAt: repos[0]?.updatedAt
        ? toRelativeTime(repos[0].updatedAt)
        : repos[0]?.updated_at
          ? toRelativeTime(repos[0].updated_at)
          : "—",
    });
  }

  return accounts;
}
