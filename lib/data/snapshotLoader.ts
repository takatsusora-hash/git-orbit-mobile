import { promises as fs } from "node:fs";
import path from "node:path";
import type { System } from "@/lib/types";

const rootDir = process.cwd();

async function readJson<T>(filePath: string) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

export async function loadAccountSummaries() {
  return readJson<
    Array<{
      id: string;
      name: string;
      repoCount: number;
      privateCount: number;
      updatedAt: string;
      configured: boolean;
    }>
  >(path.join(rootDir, "public", "data", "accounts.json"));
}

export async function loadSystemSummaries() {
  return readJson<System[]>(path.join(rootDir, "public", "data", "systems.json"));
}

export async function loadSystem(systemId: string) {
  try {
    return await readJson<System>(
      path.join(rootDir, "public", "data", "systems", `${systemId}.json`),
    );
  } catch {
    return null;
  }
}
