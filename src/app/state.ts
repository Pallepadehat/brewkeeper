import { useCallback, useEffect, useMemo, useState } from "react";
import type { DashboardState, PackageViewModel, Profile, Snapshot } from "../domain/types";
import {
  enrichPackageMetadata,
  getDependencyImpact,
  installHomebrewPackage,
  listOutdatedPackages,
  type HomebrewSearchResult,
  updateHomebrew,
  upgradePackages,
} from "../services/brew";
import { loadProfiles, saveProfiles } from "../services/profiles";
import { buildReleaseLinks } from "../services/releases";
import { assessPackageRisk, buildPackageViewModels, isSafeUpgrade } from "../services/risk";
import { createSnapshot, deleteSnapshot, listSnapshots, rollbackToSnapshot } from "../services/snapshots";

const DEFAULT_STATE: DashboardState = {
  loading: true,
  busy: false,
  error: null,
  statusMessage: "Loading Homebrew state...",
  packages: [],
  selectedIndex: 0,
  checked: {},
  safeModeOnly: false,
  showProfilePicker: false,
  showSnapshotPicker: false,
  activeProfileId: "",
  profiles: [],
  snapshots: [],
};

function clampIndex(index: number, maxExclusive: number): number {
  if (maxExclusive <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(index, maxExclusive - 1));
}

function withProfileFilter(packages: PackageViewModel[], profile: Profile | undefined): PackageViewModel[] {
  if (!profile) {
    return packages;
  }
  const includeSet = new Set(profile.includePackages);
  const excludeSet = new Set(profile.excludePackages);
  return packages.filter((entry) => {
    const includeMatch = includeSet.size === 0 || includeSet.has(entry.pkg.name);
    const excludeMatch = excludeSet.has(entry.pkg.name);
    return includeMatch && !excludeMatch;
  });
}

export function useBrewkeeperState() {
  const [state, setState] = useState<DashboardState>(DEFAULT_STATE);

  const activeProfile = useMemo(
    () => state.profiles.find((profile) => profile.id === state.activeProfileId),
    [state.activeProfileId, state.profiles],
  );

  const visiblePackages = useMemo(() => {
    const filteredByProfile = withProfileFilter(state.packages, activeProfile);
    return state.safeModeOnly ? filteredByProfile.filter(isSafeUpgrade) : filteredByProfile;
  }, [activeProfile, state.packages, state.safeModeOnly]);

  const selectedPackage = visiblePackages[clampIndex(state.selectedIndex, visiblePackages.length)] ?? null;

  const refresh = useCallback(async (message = "Refreshing packages...", skipUpdate = false) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      let updateWarning: string | null = null;

      if (skipUpdate) {
        setState((prev) => ({ ...prev, statusMessage: message }));
      } else {
        setState((prev) => ({ ...prev, statusMessage: "Running brew update..." }));
        try {
          await updateHomebrew();
        } catch (error) {
          const updateError = error instanceof Error ? error.message : "brew update failed.";
          const warningMessage = `brew update failed (${updateError}). Continuing with installed metadata.`;
          updateWarning = warningMessage;
          console.error("[brewkeeper] brew update failed:", error);
          setState((prev) => ({ ...prev, statusMessage: warningMessage }));
        }
      }

      setState((prev) => ({ ...prev, statusMessage: "Loading outdated packages..." }));
      const outdated = await listOutdatedPackages();
      const withMetadata = await enrichPackageMetadata(outdated);
      const [impactMap, releaseMap] = await Promise.all([
        getDependencyImpact(withMetadata),
        buildReleaseLinks(withMetadata),
      ]);

      const packages = buildPackageViewModels(withMetadata, impactMap, releaseMap);
      setState((prev) => {
        const checked = { ...prev.checked };
        for (const pkg of packages) {
          if (checked[pkg.pkg.name] === undefined) {
            checked[pkg.pkg.name] = false;
          }
        }
        return {
          ...prev,
          loading: false,
          packages,
          checked,
          selectedIndex: clampIndex(prev.selectedIndex, packages.length),
          statusMessage: updateWarning
            ? `Loaded ${packages.length} outdated package(s). ${updateWarning}`
            : `Loaded ${packages.length} outdated package(s).`,
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load Homebrew package state.";
      setState((prev) => ({
        ...prev,
        loading: false,
        error: message,
        statusMessage: "Load failed.",
      }));
    }
  }, []);

  const hydrate = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    const [profileStore, snapshots] = await Promise.all([loadProfiles(), listSnapshots()]);
    setState((prev) => ({
      ...prev,
      activeProfileId: profileStore.activeProfileId,
      profiles: profileStore.profiles,
      safeModeOnly:
        profileStore.profiles.find((profile) => profile.id === profileStore.activeProfileId)?.safeModeOnly ?? false,
      snapshots,
    }));
    await refresh("Refreshing Homebrew data...");
  }, [refresh]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    setState((prev) => {
      const next = clampIndex(prev.selectedIndex, visiblePackages.length);
      if (next === prev.selectedIndex) {
        return prev;
      }
      return { ...prev, selectedIndex: next };
    });
  }, [visiblePackages.length]);

  const setSelectedIndex = useCallback((nextIndex: number) => {
    setState((prev) => ({
      ...prev,
      selectedIndex: clampIndex(nextIndex, visiblePackages.length),
    }));
  }, [visiblePackages.length]);

  const moveSelection = useCallback((delta: number) => {
    setState((prev) => ({
      ...prev,
      selectedIndex: clampIndex(prev.selectedIndex + delta, visiblePackages.length),
    }));
  }, [visiblePackages.length]);

  const toggleChecked = useCallback((pkgName: string) => {
    setState((prev) => ({
      ...prev,
      checked: {
        ...prev.checked,
        [pkgName]: !prev.checked[pkgName],
      },
    }));
  }, []);

  const toggleAllVisible = useCallback(() => {
    setState((prev) => {
      const nextChecked = { ...prev.checked };
      const hasUnchecked = visiblePackages.some((pkg) => !nextChecked[pkg.pkg.name]);
      for (const pkg of visiblePackages) {
        nextChecked[pkg.pkg.name] = hasUnchecked;
      }
      return { ...prev, checked: nextChecked };
    });
  }, [visiblePackages]);

  const toggleSafeMode = useCallback(async () => {
    setState((prev) => {
      const safeModeOnly = !prev.safeModeOnly;
      const profile = prev.profiles.find((entry) => entry.id === prev.activeProfileId);
      if (profile) {
        const updatedProfiles = prev.profiles.map((entry) =>
          entry.id === profile.id ? { ...entry, safeModeOnly } : entry,
        );
        void saveProfiles({ activeProfileId: prev.activeProfileId, profiles: updatedProfiles });
        return { ...prev, safeModeOnly, profiles: updatedProfiles };
      }
      return { ...prev, safeModeOnly };
    });
  }, []);

  const selectProfile = useCallback(async (profileId: string) => {
    const profile = state.profiles.find((entry) => entry.id === profileId);
    if (!profile) {
      return;
    }

    await saveProfiles({ activeProfileId: profile.id, profiles: state.profiles });
    setState((prev) => ({
      ...prev,
      activeProfileId: profile.id,
      safeModeOnly: profile.safeModeOnly,
      selectedIndex: 0,
      statusMessage: `Profile switched to ${profile.name}.`,
    }));
  }, [state.profiles]);

  const runUpgrade = useCallback(async () => {
    const selectedPackages = visiblePackages.filter((entry) => state.checked[entry.pkg.name]).map((entry) => entry.pkg);
    if (selectedPackages.length === 0) {
      setState((prev) => ({ ...prev, statusMessage: "No package selected for upgrade." }));
      return;
    }

    setState((prev) => ({ ...prev, busy: true, statusMessage: "Running brew upgrade..." }));
    try {
      const output = await upgradePackages(selectedPackages);
      setState((prev) => ({
        ...prev,
        busy: false,
        statusMessage: output.split("\n")[0] ?? `Upgraded ${selectedPackages.length} package(s).`,
      }));
      await refresh("Reloading package state after upgrade...", true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upgrade failed.";
      setState((prev) => ({ ...prev, busy: false, error: message, statusMessage: "Upgrade failed." }));
    }
  }, [refresh, state.checked, visiblePackages]);

  const makeSnapshot = useCallback(async (name?: string) => {
    setState((prev) => ({ ...prev, busy: true, statusMessage: "Creating snapshot..." }));
    try {
      const snapshot = await createSnapshot(name);
      const snapshots = await listSnapshots();
      setState((prev) => ({
        ...prev,
        busy: false,
        snapshots,
        statusMessage: `Snapshot created: ${snapshot.name}`,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Snapshot failed.";
      setState((prev) => ({ ...prev, busy: false, error: message, statusMessage: "Snapshot failed." }));
    }
  }, []);

  const refreshSnapshots = useCallback(async () => {
    try {
      const snapshots = await listSnapshots();
      setState((prev) => ({ ...prev, snapshots }));
    } catch {
      // Ignore snapshot refresh errors in the background.
    }
  }, []);

  const runRollback = useCallback(async (snapshot: Snapshot) => {
    setState((prev) => ({ ...prev, busy: true, statusMessage: `Rolling back to ${snapshot.name}...` }));
    try {
      const output = await rollbackToSnapshot(snapshot);
      setState((prev) => ({
        ...prev,
        busy: false,
        statusMessage: output.split("\n")[0] ?? `Rollback complete: ${snapshot.name}`,
      }));
      await refresh("Refreshing package state after rollback...", true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Rollback failed.";
      setState((prev) => ({ ...prev, busy: false, error: message, statusMessage: "Rollback failed." }));
    }
  }, [refresh]);

  const runInstallPackage = useCallback(async (pkg: HomebrewSearchResult) => {
    setState((prev) => ({
      ...prev,
      busy: true,
      error: null,
      statusMessage: `Installing ${pkg.name} (${pkg.type})...`,
    }));

    try {
      const output = await installHomebrewPackage(pkg);
      setState((prev) => ({
        ...prev,
        busy: false,
        statusMessage: output.split("\n")[0] ?? `Installed ${pkg.name}.`,
      }));
      await refresh("Refreshing package state after install...", true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Install failed.";
      setState((prev) => ({
        ...prev,
        busy: false,
        error: message,
        statusMessage: "Install failed.",
      }));
    }
  }, [refresh]);

  const runDeleteSnapshot = useCallback(async (snapshot: Snapshot) => {
    setState((prev) => ({
      ...prev,
      busy: true,
      error: null,
      statusMessage: `Deleting snapshot ${snapshot.name}...`,
    }));

    try {
      await deleteSnapshot(snapshot);
      const snapshots = await listSnapshots();
      setState((prev) => ({
        ...prev,
        busy: false,
        snapshots,
        statusMessage: `Snapshot deleted: ${snapshot.name}`,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Delete snapshot failed.";
      setState((prev) => ({
        ...prev,
        busy: false,
        error: message,
        statusMessage: "Delete snapshot failed.",
      }));
    }
  }, []);

  return {
    state,
    visiblePackages,
    selectedPackage,
    activeProfile,
    refresh,
    setSelectedIndex,
    moveSelection,
    toggleChecked,
    toggleAllVisible,
    toggleSafeMode,
    selectProfile,
    runUpgrade,
    runInstallPackage,
    makeSnapshot,
    refreshSnapshots,
    runRollback,
    runDeleteSnapshot,
  };
}

export function badgeForRisk(viewModel: PackageViewModel): string {
  const risk = viewModel.risk.level.toUpperCase();
  const bump = viewModel.risk.bump.toUpperCase();
  return `${risk}/${bump}`;
}

export function selectedCount(visiblePackages: PackageViewModel[], checked: Record<string, boolean>): number {
  return visiblePackages.filter((entry) => checked[entry.pkg.name]).length;
}

export function canRollback(snapshots: Snapshot[]): boolean {
  return snapshots.length > 0;
}

export function likelyBreakByRisk(viewModel: PackageViewModel): boolean {
  return assessPackageRisk(viewModel.pkg, {
    packageName: viewModel.pkg.name,
    dependents: viewModel.risk.dependencyImpactPreview,
  }).likelyBreaking;
}
