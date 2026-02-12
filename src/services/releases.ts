import type { OutdatedPackage, ReleaseLinks } from "../domain/types";

interface GithubRepo {
  owner: string;
  repo: string;
}

function parseGithubRepo(url: string): GithubRepo | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "github.com") {
      return null;
    }

    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length < 2) {
      return null;
    }
    const owner = segments[0];
    const repo = segments[1];
    if (!owner || !repo) {
      return null;
    }
    return { owner, repo: repo.replace(/\.git$/, "") };
  } catch {
    return null;
  }
}

async function fetchLatestGithubRelease(owner: string, repo: string): Promise<string | undefined> {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, {
      headers: {
        "User-Agent": "brewkeeper",
        Accept: "application/vnd.github+json",
      },
    });
    if (!response.ok) {
      return undefined;
    }

    const payload: any = await response.json();
    const body = typeof payload?.body === "string" ? payload.body.trim() : "";
    if (!body) {
      return undefined;
    }

    return body.slice(0, 400);
  } catch {
    return undefined;
  }
}

export async function buildReleaseLinks(packages: OutdatedPackage[]): Promise<Map<string, ReleaseLinks>> {
  const links = new Map<string, ReleaseLinks>();

  for (const pkg of packages) {
    const release: ReleaseLinks = {};
    if (pkg.homepage) {
      release.homepage = pkg.homepage;
      const github = parseGithubRepo(pkg.homepage);
      if (github) {
        release.repository = `https://github.com/${github.owner}/${github.repo}`;
        release.releases = `https://github.com/${github.owner}/${github.repo}/releases`;
        release.changelog = `https://github.com/${github.owner}/${github.repo}/blob/HEAD/CHANGELOG.md`;
        release.latestNotes = await fetchLatestGithubRelease(github.owner, github.repo);
      }
    }
    links.set(pkg.name, release);
  }

  return links;
}
