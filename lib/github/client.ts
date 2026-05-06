export function getGitHubHeaders() {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return undefined;
  }

  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  };
}
