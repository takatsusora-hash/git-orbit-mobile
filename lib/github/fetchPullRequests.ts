import type { RepoRef } from "@/lib/types";

export async function fetchPullRequests(repo: RepoRef) {
  return {
    repo,
    pullRequests: [],
    mode: "placeholder",
  };
}
