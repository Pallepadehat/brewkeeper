import { useMemo, useState } from "react";
import { useKeyboard, useRenderer } from "@opentui/react";
import { canRollback, selectedCount, useBrewkeeperState } from "./state";
import { Footer } from "../ui/Footer";
import { Header } from "../ui/Header";
import { PackageDetails } from "../ui/PackageDetails";
import { PackageList } from "../ui/PackageList";
import { PickerModal } from "../ui/PickerModal";
import { Spinner } from "../ui/Spinner";

type ModalType = "none" | "profile" | "snapshot";

export function App() {
  const renderer = useRenderer();
  const {
    state,
    visiblePackages,
    selectedPackage,
    activeProfile,
    refresh,
    moveSelection,
    toggleChecked,
    toggleAllVisible,
    toggleSafeMode,
    selectProfile,
    runUpgrade,
    makeSnapshot,
    runRollback,
  } = useBrewkeeperState();

  const [modal, setModal] = useState<ModalType>("none");
  const [modalIndex, setModalIndex] = useState(0);

  const selectedVisibleCount = selectedCount(visiblePackages, state.checked);

  const profileOptions = useMemo(() => state.profiles.map((p) => p.name), [state.profiles]);
  const snapshotOptions = useMemo(
    () => state.snapshots.map((s) => `${s.name} (${s.createdAt.split("T")[0]})`),
    [state.snapshots],
  );

  useKeyboard((key) => {
    if (key.ctrl && key.name === "c") {
      renderer.destroy();
      return;
    }

    // Modal navigation
    if (modal !== "none") {
      if (key.name === "escape" || key.name === "q") {
        setModal("none");
        return;
      }
      if (key.name === "up" || key.name === "k") {
        setModalIndex((prev) => Math.max(0, prev - 1));
        return;
      }
      if (key.name === "down" || key.name === "j") {
        const max = modal === "profile" ? profileOptions.length : snapshotOptions.length;
        setModalIndex((prev) => Math.min(Math.max(0, max - 1), prev + 1));
        return;
      }
      if (key.name === "enter") {
        if (modal === "profile") {
          const profile = state.profiles[modalIndex];
          if (profile) void selectProfile(profile.id);
        } else if (modal === "snapshot") {
          const snapshot = state.snapshots[modalIndex];
          if (snapshot) void runRollback(snapshot);
        }
        setModal("none");
      }
      return;
    }

    // Global shortcuts
    if (key.name === "q" || key.name === "escape") {
      renderer.destroy();
      return;
    }
    if (key.name === "up" || key.name === "k") {
      moveSelection(-1);
      return;
    }
    if (key.name === "down" || key.name === "j") {
      moveSelection(1);
      return;
    }
    if (key.name === "space") {
      if (selectedPackage) toggleChecked(selectedPackage.pkg.name);
      return;
    }
    if (key.name === "a") {
      toggleAllVisible();
      return;
    }
    if (key.name === "s") {
      void toggleSafeMode();
      return;
    }
    if (key.name === "r" && !key.shift) {
      void refresh();
      return;
    }
    if (key.name === "u") {
      void runUpgrade();
      return;
    }
    if (key.name === "b") {
      void makeSnapshot();
      return;
    }
    if (key.name === "p") {
      const current = state.profiles.findIndex((p) => p.id === state.activeProfileId);
      setModalIndex(Math.max(0, current));
      setModal("profile");
      return;
    }
    if (key.shift && key.name === "r") {
      if (canRollback(state.snapshots)) {
        setModalIndex(0);
        setModal("snapshot");
      }
    }
  });

  // Full-screen layout
  return (
    <box position="relative" flexDirection="column" width="100%" height="100%">
      {/* Header */}
      <Header
        safeModeOnly={state.safeModeOnly}
        loading={state.loading}
        busy={state.busy}
      />

      {/* Main body */}
      {state.loading && state.packages.length === 0 ? (
        <box flexGrow={1} justifyContent="center" alignItems="center">
          <Spinner label={state.statusMessage} />
        </box>
      ) : (
        <box flexDirection="row" flexGrow={1}>
          <PackageList
            packages={visiblePackages}
            selectedIndex={state.selectedIndex}
            checked={state.checked}
          />
          <PackageDetails selectedPackage={selectedPackage} />
        </box>
      )}

      {/* Footer */}
      <Footer
        statusMessage={state.statusMessage}
        error={state.error}
        selectedCount={selectedVisibleCount}
        visibleCount={visiblePackages.length}
      />

      {/* Modal overlays */}
      <PickerModal
        visible={modal === "profile"}
        title="Switch Profile"
        options={profileOptions}
        selectedIndex={modalIndex}
      />
      <PickerModal
        visible={modal === "snapshot"}
        title="Rollback to Snapshot"
        options={snapshotOptions}
        selectedIndex={modalIndex}
      />
    </box>
  );
}
