import type { ModuleStatus, StatusFile } from "@/lib/types";

export function calculateProgress(
  signals: StatusFile["modules"][number]["progressSignals"],
) {
  let total = 0;

  if (signals.pathExists) total += 15;
  if (signals.keyFiles) total += 10;
  if (signals.linkedWork) total += 10;
  if (signals.mergedToMain) total += 15;

  if (signals.build === "pass") total += 15;
  if (signals.typecheck === "pass") total += 10;
  if (signals.test === "pass") total += 15;
  if (signals.deploy === "pass") total += 10;
  if (signals.runtime === "pass") total += 10;

  return Math.max(0, Math.min(100, total));
}

export function deriveModuleStatus(
  progress: number,
  checks: StatusFile["modules"][number]["checks"],
): ModuleStatus {
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
