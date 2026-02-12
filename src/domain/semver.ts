import type { VersionBump } from "./types";

interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
}

const VERSION_RE = /(\d+)(?:\.(\d+))?(?:\.(\d+))?/;

export function parseSemverLike(version: string): ParsedVersion | null {
  const match = version.match(VERSION_RE);
  if (!match) {
    return null;
  }

  const major = Number(match[1]);
  const minor = Number(match[2] ?? "0");
  const patch = Number(match[3] ?? "0");
  if ([major, minor, patch].some((part) => Number.isNaN(part))) {
    return null;
  }

  return { major, minor, patch };
}

export function classifyVersionBump(fromVersion: string, toVersion: string): VersionBump {
  const from = parseSemverLike(fromVersion);
  const to = parseSemverLike(toVersion);
  if (!from || !to) {
    return "unknown";
  }

  if (to.major > from.major) {
    return "major";
  }
  if (to.minor > from.minor) {
    return "minor";
  }
  if (to.patch > from.patch) {
    return "patch";
  }

  return "unknown";
}
