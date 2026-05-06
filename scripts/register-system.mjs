import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const configPath = path.join(root, "config", "workspace.config.json");

function readFlag(name) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) {
    return null;
  }
  return process.argv[index + 1] ?? null;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeRepos(raw, owner) {
  return raw.split(",").map((entry) => {
    const value = entry.trim();
    if (!value) {
      return null;
    }

    if (value.startsWith("https://github.com/")) {
      const [, repoOwner, repoName] = value.replace("https://github.com/", "").split("/");
      if (repoOwner && repoName) {
        return { owner: repoOwner, repo: repoName.replace(/\.git$/, "") };
      }
    }

    if (value.includes("/")) {
      const [repoOwner, repoName] = value.split("/", 2);
      return { owner: repoOwner, repo: repoName };
    }

    return { owner, repo: value };
  }).filter(Boolean);
}

async function main() {
  const name = readFlag("name");
  const owner = readFlag("owner");
  const reposRaw = readFlag("repos");

  if (!name || !owner || !reposRaw) {
    throw new Error(
      "Usage: node scripts/register-system.mjs --name \"System\" --owner owner --repos repo1,repo2",
    );
  }

  const tags = (readFlag("tags") ?? "live").split(",").map((item) => item.trim()).filter(Boolean);
  const summary = readFlag("summary") ?? `Live repository view from the ${owner} account.`;
  const localPath = readFlag("local-path") ?? undefined;
  const mapFile = readFlag("map-file") ?? undefined;
  const id = readFlag("id") ?? slugify(name);
  const tokenEnv = readFlag("token-env") ?? `GITHUB_TOKEN_${owner.replace(/[^A-Za-z0-9]/g, "_").toUpperCase()}`;

  const config = JSON.parse(await fs.readFile(configPath, "utf8"));
  const repos = normalizeRepos(reposRaw, owner);

  if (!config.accounts.some((account) => account.id === owner)) {
    config.accounts.push({
      id: owner,
      name: owner,
      tokenEnv,
    });
  }

  const nextSystem = {
    id,
    name,
    owner,
    repos: repos.map((entry) => entry.repo),
    ...(localPath ? { localPath } : {}),
    ...(mapFile ? { mapFile } : {}),
    tags,
    summary,
  };

  const existingIndex = config.systems.findIndex((system) => system.id === id);
  if (existingIndex >= 0) {
    config.systems[existingIndex] = nextSystem;
  } else {
    config.systems.push(nextSystem);
  }

  await fs.writeFile(configPath, JSON.stringify(config, null, 2) + "\n");
  console.log(`Registered system ${id}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
