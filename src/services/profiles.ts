import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Profile } from "../domain/types";

interface ProfileStore {
  activeProfileId: string;
  profiles: Profile[];
}

const DEFAULT_PROFILES: Profile[] = [
  {
    id: "work",
    name: "Work machine",
    safeModeOnly: true,
    includePackages: [],
    excludePackages: [],
  },
  {
    id: "hobby",
    name: "Hobby machine",
    safeModeOnly: false,
    includePackages: [],
    excludePackages: [],
  },
];

function preferredConfigDir(): string {
  const home = process.env.HOME ?? process.cwd();
  const xdg = process.env.XDG_CONFIG_HOME;
  return xdg ? path.join(xdg, "brewkeeper") : path.join(home, ".config", "brewkeeper");
}

function fallbackConfigDir(): string {
  return path.join(process.cwd(), ".brewkeeper");
}

async function ensureConfigDir(): Promise<string> {
  const candidates = [preferredConfigDir(), fallbackConfigDir()];
  for (const candidate of candidates) {
    try {
      await mkdir(candidate, { recursive: true });
      return candidate;
    } catch {
      // Try the next candidate.
    }
  }
  throw new Error("Unable to initialize Brewkeeper config directory.");
}

function fallbackStore(): ProfileStore {
  const firstProfile = DEFAULT_PROFILES[0]!;
  return {
    activeProfileId: firstProfile.id,
    profiles: DEFAULT_PROFILES,
  };
}

export async function loadProfiles(): Promise<ProfileStore> {
  const candidatePaths = [path.join(preferredConfigDir(), "profiles.json"), path.join(fallbackConfigDir(), "profiles.json")];
  try {
    for (const profilesPath of candidatePaths) {
      try {
        const raw = await readFile(profilesPath, "utf8");
        const data = JSON.parse(raw);
        const profiles = Array.isArray(data?.profiles) ? data.profiles : [];
        const safeProfiles = profiles.filter(
          (entry: any): entry is Profile =>
            typeof entry?.id === "string" &&
            typeof entry?.name === "string" &&
            typeof entry?.safeModeOnly === "boolean" &&
            Array.isArray(entry?.includePackages) &&
            Array.isArray(entry?.excludePackages),
        );

        if (safeProfiles.length === 0) {
          return fallbackStore();
        }
        const firstProfile = safeProfiles[0]!;
        const activeProfileId =
          typeof data?.activeProfileId === "string" &&
          safeProfiles.some((profile: Profile) => profile.id === data.activeProfileId)
            ? data.activeProfileId
            : firstProfile.id;

        return {
          activeProfileId,
          profiles: safeProfiles,
        };
      } catch {
        // Try the next location.
      }
    }
    return fallbackStore();
  } catch {
    return fallbackStore();
  }
}

export async function saveProfiles(store: ProfileStore): Promise<void> {
  const configDir = await ensureConfigDir();
  const profilesPath = path.join(configDir, "profiles.json");
  await writeFile(profilesPath, JSON.stringify(store, null, 2), "utf8");
}

export function applyProfileFilter(profile: Profile, packageNames: string[]): string[] {
  const includeSet = new Set(profile.includePackages);
  const excludeSet = new Set(profile.excludePackages);

  return packageNames.filter((name) => {
    const includeMatch = includeSet.size === 0 || includeSet.has(name);
    const excludeMatch = excludeSet.has(name);
    return includeMatch && !excludeMatch;
  });
}
