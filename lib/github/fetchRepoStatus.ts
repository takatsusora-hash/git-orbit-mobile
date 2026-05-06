import type { RepoRef } from "@/lib/types";

export async function fetchRepoStatus(repo: RepoRef) {
  return {
    repo,
    mode: "placeholder",
    note: "MVP uses local status JSON until live GitHub sync is enabled.",
  };
}
