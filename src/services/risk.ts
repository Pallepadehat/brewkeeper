import { classifyVersionBump } from "../domain/semver";
import type { OutdatedPackage, PackageImpact, PackageViewModel, ReleaseLinks, RiskAssessment, RiskLevel } from "../domain/types";

function getRiskLevel(bump: RiskAssessment["bump"], dependencyImpactCount: number, hasCaveatWarning: boolean): RiskLevel {
  if (bump === "major") {
    return "high";
  }
  if (dependencyImpactCount >= 5 || hasCaveatWarning) {
    return "high";
  }
  if (bump === "minor" || dependencyImpactCount >= 1) {
    return "medium";
  }
  return "low";
}

export function assessPackageRisk(pkg: OutdatedPackage, impact: PackageImpact | undefined): RiskAssessment {
  const bump = classifyVersionBump(pkg.currentVersion, pkg.latestVersion);
  const dependencyImpactCount = impact?.dependents.length ?? 0;
  const dependencyImpactPreview = (impact?.dependents ?? []).slice(0, 6);
  const caveatWarning = pkg.caveats?.trim() ? pkg.caveats.trim().slice(0, 180) : null;
  const likelyBreaking = bump === "major" || caveatWarning !== null;

  const reasons: string[] = [];
  if (bump === "major") {
    reasons.push("Major version bump detected.");
  } else if (bump === "minor") {
    reasons.push("Minor version bump; potential behavior changes.");
  } else if (bump === "patch") {
    reasons.push("Patch release; generally safer update.");
  } else {
    reasons.push("Could not confidently classify semantic version bump.");
  }
  if (dependencyImpactCount > 0) {
    reasons.push(`Impacts ${dependencyImpactCount} installed dependent package(s).`);
  }
  if (caveatWarning) {
    reasons.push("Homebrew caveats indicate additional migration or runtime caution.");
  }

  return {
    packageName: pkg.name,
    bump,
    likelyBreaking,
    dependencyImpactCount,
    dependencyImpactPreview,
    caveatWarning,
    level: getRiskLevel(bump, dependencyImpactCount, caveatWarning !== null),
    reasons,
  };
}

export function buildPackageViewModels(
  packages: OutdatedPackage[],
  impacts: Map<string, PackageImpact>,
  releaseLinks: Map<string, ReleaseLinks>,
): PackageViewModel[] {
  return packages
    .map((pkg) => {
      const risk = assessPackageRisk(pkg, impacts.get(pkg.name));
      return {
        pkg,
        risk,
        releaseLinks: releaseLinks.get(pkg.name) ?? {},
      } satisfies PackageViewModel;
    })
    .sort((a, b) => {
      const rank: Record<RiskLevel, number> = {
        high: 0,
        medium: 1,
        low: 2,
      };
      return rank[a.risk.level] - rank[b.risk.level] || a.pkg.name.localeCompare(b.pkg.name);
    });
}

export function isSafeUpgrade(viewModel: PackageViewModel): boolean {
  return viewModel.risk.bump === "patch" || viewModel.risk.bump === "minor";
}
