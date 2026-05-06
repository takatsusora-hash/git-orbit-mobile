import type { Module, StatusFile, SystemMapFile } from "@/lib/types";
import { calculateProgress, deriveModuleStatus } from "./progressScorer";

export function resolveModules(
  systemId: string,
  mapModules: SystemMapFile["modules"],
  statusModules: StatusFile["modules"],
): Module[] {
  return mapModules.map((module) => {
    const live = statusModules.find((item) => item.id === module.id);

    const fallbackSignals: StatusFile["modules"][number]["progressSignals"] = {
      pathExists: false,
      keyFiles: false,
      linkedWork: false,
      mergedToMain: false,
      build: "unknown",
      typecheck: "unknown",
      test: "unknown",
      deploy: "unknown",
      runtime: "unknown",
    };

    const fallbackChecks = {
      exists: false,
      build: "unknown",
      typecheck: "unknown",
      test: "unknown",
      deploy: "unknown",
      runtime: "unknown",
    } as const;

    const signals = live?.progressSignals ?? fallbackSignals;
    const checks = live?.checks ?? fallbackChecks;
    const progress = calculateProgress(signals);

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
      evidence: live?.evidence ?? [],
    };
  });
}
