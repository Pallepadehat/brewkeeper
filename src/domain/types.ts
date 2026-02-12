export type VersionBump = "major" | "minor" | "patch" | "unknown";

export type RiskLevel = "low" | "medium" | "high";

export interface OutdatedPackage {
  name: string;
  type: "formula" | "cask";
  currentVersion: string;
  latestVersion: string;
  pinned: boolean;
  homepage?: string;
  caveats?: string;
}

export interface PackageImpact {
  packageName: string;
  dependents: string[];
}

export interface RiskAssessment {
  packageName: string;
  bump: VersionBump;
  likelyBreaking: boolean;
  dependencyImpactCount: number;
  dependencyImpactPreview: string[];
  caveatWarning: string | null;
  level: RiskLevel;
  reasons: string[];
}

export interface PackageViewModel {
  pkg: OutdatedPackage;
  risk: RiskAssessment;
  releaseLinks: ReleaseLinks;
}

export interface Profile {
  id: string;
  name: string;
  safeModeOnly: boolean;
  includePackages: string[];
  excludePackages: string[];
}

export interface Snapshot {
  id: string;
  name: string;
  path: string;
  createdAt: string;
}

export interface ReleaseLinks {
  homepage?: string;
  repository?: string;
  releases?: string;
  changelog?: string;
  latestNotes?: string;
}

export interface DashboardState {
  loading: boolean;
  busy: boolean;
  error: string | null;
  statusMessage: string;
  packages: PackageViewModel[];
  selectedIndex: number;
  checked: Record<string, boolean>;
  safeModeOnly: boolean;
  showProfilePicker: boolean;
  showSnapshotPicker: boolean;
  activeProfileId: string;
  profiles: Profile[];
  snapshots: Snapshot[];
}
