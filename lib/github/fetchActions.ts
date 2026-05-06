import type { RepoRef } from "@/lib/types";

export async function fetchActions(repo: RepoRef) {
  return {
    repo,
    runs: [],
    mode: "placeholder",
  };
}
