import type { OutdatedPackage, PackageImpact } from "../domain/types";

interface CommandResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  code: number;
}

export interface HomebrewSearchResult {
  name: string;
  type: "formula" | "cask";
}

export interface HomebrewPackagePreview {
  name: string;
  type: "formula" | "cask";
  description?: string;
  homepage?: string;
  latestVersion?: string;
  installedVersions: string[];
  installed: boolean;
  dependencies: string[];
  caveats?: string;
  tap?: string;
}

async function runCommand(cmd: string[]): Promise<CommandResult> {
  const proc = Bun.spawn({
    cmd,
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, stderr, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  return {
    ok: code === 0,
    stdout,
    stderr,
    code,
  };
}

function normalizeOutdatedFormula(entry: any): OutdatedPackage | null {
  const name = typeof entry?.name === "string" ? entry.name : null;
  const currentVersion = typeof entry?.installed_versions?.[0] === "string" ? entry.installed_versions[0] : null;
  const latestVersion = typeof entry?.current_version === "string" ? entry.current_version : null;
  if (!name || !currentVersion || !latestVersion) return null;

  return {
    name,
    type: "formula",
    currentVersion,
    latestVersion,
    pinned: Boolean(entry?.pinned),
  };
}

function normalizeOutdatedCask(entry: any): OutdatedPackage | null {
  const name = typeof entry?.name === "string" ? entry.name : null;
  const currentVersion = typeof entry?.installed_versions === "string"
    ? entry.installed_versions
    : typeof entry?.installed_versions?.[0] === "string"
      ? entry.installed_versions[0]
      : null;
  const latestVersion = typeof entry?.current_version === "string" ? entry.current_version : null;
  if (!name || !currentVersion || !latestVersion) return null;

  return {
    name,
    type: "cask",
    currentVersion,
    latestVersion,
    pinned: false,
  };
}

export async function listOutdatedPackages(): Promise<OutdatedPackage[]> {
  const result = await runCommand(["brew", "outdated", "--json=v2"]);
  if (!result.ok) {
    throw new Error(result.stderr || "Failed to load outdated packages from Homebrew.");
  }

  let payload: any;
  try {
    payload = JSON.parse(result.stdout);
  } catch {
    throw new Error("Homebrew returned invalid JSON for outdated packages.");
  }

  const formulae = Array.isArray(payload?.formulae) ? payload.formulae : [];
  const casks = Array.isArray(payload?.casks) ? payload.casks : [];

  return [
    ...formulae.map((entry: any) => normalizeOutdatedFormula(entry)).filter(Boolean),
    ...casks.map((entry: any) => normalizeOutdatedCask(entry)).filter(Boolean),
  ] as OutdatedPackage[];
}

export async function updateHomebrew(): Promise<void> {
  const result = await runCommand(["brew", "update"]);
  if (!result.ok) {
    throw new Error(result.stderr || "Failed to run brew update.");
  }
}

export async function enrichPackageMetadata(packages: OutdatedPackage[]): Promise<OutdatedPackage[]> {
  const byName = new Map<string, { homepage?: string; caveats?: string }>();

  // Enrich formulae
  const formulaeNames = packages.filter((pkg) => pkg.type === "formula").map((pkg) => pkg.name);
  if (formulaeNames.length > 0) {
    const result = await runCommand(["brew", "info", "--json=v2", ...formulaeNames]);
    if (result.ok) {
      try {
        const payload: any = JSON.parse(result.stdout);
        const entries = Array.isArray(payload?.formulae) ? payload.formulae : [];
        for (const entry of entries) {
          if (typeof entry?.name !== "string") continue;
          byName.set(entry.name, {
            homepage: typeof entry?.homepage === "string" ? entry.homepage : undefined,
            caveats: typeof entry?.caveats === "string" && entry.caveats.trim().length > 0 ? entry.caveats : undefined,
          });
        }
      } catch {
        // Ignore parse errors
      }
    }
  }

  // Enrich casks
  const caskNames = packages.filter((pkg) => pkg.type === "cask").map((pkg) => pkg.name);
  if (caskNames.length > 0) {
    const result = await runCommand(["brew", "info", "--json=v2", "--cask", ...caskNames]);
    if (result.ok) {
      try {
        const payload: any = JSON.parse(result.stdout);
        const entries = Array.isArray(payload?.casks) ? payload.casks : [];
        for (const entry of entries) {
          const token = typeof entry?.token === "string" ? entry.token : typeof entry?.name?.[0] === "string" ? entry.name[0] : null;
          if (!token) continue;
          byName.set(token, {
            homepage: typeof entry?.homepage === "string" ? entry.homepage : undefined,
            caveats: typeof entry?.caveats === "string" && entry.caveats.trim().length > 0 ? entry.caveats : undefined,
          });
        }
      } catch {
        // Ignore parse errors
      }
    }
  }

  return packages.map((pkg) => {
    const details = byName.get(pkg.name);
    if (!details) return pkg;
    return {
      ...pkg,
      homepage: details.homepage ?? pkg.homepage,
      caveats: details.caveats ?? pkg.caveats,
    };
  });
}

export async function getDependencyImpact(packages: OutdatedPackage[]): Promise<Map<string, PackageImpact>> {
  const impacts = new Map<string, PackageImpact>();

  for (const pkg of packages) {
    if (pkg.type !== "formula") {
      impacts.set(pkg.name, { packageName: pkg.name, dependents: [] });
      continue;
    }

    const result = await runCommand(["brew", "uses", "--installed", "--recursive", pkg.name]);
    if (!result.ok) {
      impacts.set(pkg.name, { packageName: pkg.name, dependents: [] });
      continue;
    }

    const dependents = result.stdout
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    impacts.set(pkg.name, { packageName: pkg.name, dependents });
  }

  return impacts;
}

export async function upgradePackages(packages: OutdatedPackage[]): Promise<string> {
  if (packages.length === 0) {
    return "No packages selected.";
  }

  const formulae = packages.filter((pkg) => pkg.type === "formula").map((pkg) => pkg.name);
  const casks = packages.filter((pkg) => pkg.type === "cask").map((pkg) => pkg.name);
  const messages: string[] = [];

  if (formulae.length > 0) {
    const result = await runCommand(["brew", "upgrade", ...formulae]);
    if (!result.ok) {
      throw new Error(result.stderr || "Homebrew formula upgrade failed.");
    }
    messages.push(result.stdout.trim() || `Upgraded ${formulae.length} formula(e).`);
  }

  if (casks.length > 0) {
    const result = await runCommand(["brew", "upgrade", "--cask", ...casks]);
    if (!result.ok) {
      throw new Error(result.stderr || "Homebrew cask upgrade failed.");
    }
    messages.push(result.stdout.trim() || `Upgraded ${casks.length} cask(s).`);
  }

  return messages.join(" ") || `Upgraded ${packages.length} package(s).`;
}

function parseSearchOutput(raw: string, type: "formula" | "cask"): HomebrewSearchResult[] {
  const entries = raw
    .split(/\s+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => line !== "Formulae" && line !== "Casks");

  return entries.map((name) => ({ name, type }));
}

export async function searchHomebrewPackages(query: string): Promise<HomebrewSearchResult[]> {
  const normalized = query.trim();
  if (normalized.length === 0) {
    return [];
  }

  const [formulaResult, caskResult] = await Promise.all([
    runCommand(["brew", "search", "--formula", normalized]),
    runCommand(["brew", "search", "--cask", normalized]),
  ]);

  if (!formulaResult.ok && !caskResult.ok) {
    throw new Error(formulaResult.stderr || caskResult.stderr || "Failed to search Homebrew packages.");
  }

  const combined = [
    ...(formulaResult.ok ? parseSearchOutput(formulaResult.stdout, "formula") : []),
    ...(caskResult.ok ? parseSearchOutput(caskResult.stdout, "cask") : []),
  ];

  const unique = new Map<string, HomebrewSearchResult>();
  for (const entry of combined) {
    const key = `${entry.type}:${entry.name}`;
    if (!unique.has(key)) {
      unique.set(key, entry);
    }
  }

  return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function toStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return [];
  }
  return input.filter((entry): entry is string => typeof entry === "string");
}

export async function loadHomebrewPackagePreview(pkg: HomebrewSearchResult): Promise<HomebrewPackagePreview> {
  if (pkg.type === "formula") {
    const result = await runCommand(["brew", "info", "--json=v2", pkg.name]);
    if (!result.ok) {
      throw new Error(result.stderr || `Failed to load brew info for ${pkg.name}.`);
    }

    let payload: any;
    try {
      payload = JSON.parse(result.stdout);
    } catch {
      throw new Error(`Homebrew returned invalid JSON for ${pkg.name}.`);
    }

    const formula = Array.isArray(payload?.formulae) ? payload.formulae[0] : undefined;
    if (!formula) {
      throw new Error(`No formula metadata found for ${pkg.name}.`);
    }

    const installedEntries = Array.isArray(formula?.installed) ? formula.installed : [];
    const installedVersions = installedEntries
      .map((entry: any) => (typeof entry?.version === "string" ? entry.version : null))
      .filter((version: string | null): version is string => version !== null);

    return {
      name: typeof formula?.name === "string" ? formula.name : pkg.name,
      type: "formula",
      description: typeof formula?.desc === "string" ? formula.desc : undefined,
      homepage: typeof formula?.homepage === "string" ? formula.homepage : undefined,
      latestVersion: typeof formula?.versions?.stable === "string" ? formula.versions.stable : undefined,
      installedVersions,
      installed: installedVersions.length > 0,
      dependencies: toStringArray(formula?.dependencies).slice(0, 16),
      caveats: typeof formula?.caveats === "string" ? formula.caveats.trim() || undefined : undefined,
      tap: typeof formula?.tap === "string" ? formula.tap : undefined,
    };
  }

  const result = await runCommand(["brew", "info", "--json=v2", "--cask", pkg.name]);
  if (!result.ok) {
    throw new Error(result.stderr || `Failed to load brew info for ${pkg.name}.`);
  }

  let payload: any;
  try {
    payload = JSON.parse(result.stdout);
  } catch {
    throw new Error(`Homebrew returned invalid JSON for ${pkg.name}.`);
  }

  const cask = Array.isArray(payload?.casks) ? payload.casks[0] : undefined;
  if (!cask) {
    throw new Error(`No cask metadata found for ${pkg.name}.`);
  }

  const installedVersions = toStringArray(cask?.installed);
  const dependentFormulae = toStringArray(cask?.depends_on?.formula);
  const dependentCasks = toStringArray(cask?.depends_on?.cask);

  return {
    name: typeof cask?.token === "string" ? cask.token : pkg.name,
    type: "cask",
    description: typeof cask?.desc === "string" ? cask.desc : undefined,
    homepage: typeof cask?.homepage === "string" ? cask.homepage : undefined,
    latestVersion: typeof cask?.version === "string" ? cask.version : undefined,
    installedVersions,
    installed: installedVersions.length > 0,
    dependencies: [...dependentFormulae, ...dependentCasks].slice(0, 16),
    caveats: typeof cask?.caveats === "string" ? cask.caveats.trim() || undefined : undefined,
    tap: typeof cask?.tap === "string" ? cask.tap : undefined,
  };
}

export async function installHomebrewPackage(pkg: HomebrewSearchResult): Promise<string> {
  const cmd = pkg.type === "cask"
    ? ["brew", "install", "--cask", pkg.name]
    : ["brew", "install", pkg.name];
  const result = await runCommand(cmd);
  if (!result.ok) {
    throw new Error(result.stderr || `Failed to install ${pkg.name}.`);
  }
  return result.stdout.trim() || `Installed ${pkg.name}.`;
}
