import { useEffect, useMemo, useRef, useState } from "react";
import { useKeyboard, useRenderer } from "@opentui/react";
import { selectedCount, useBrewkeeperState } from "./state";
import {
  loadHomebrewPackagePreview,
  searchHomebrewPackages,
  type HomebrewPackagePreview,
  type HomebrewSearchResult,
} from "../services/brew";
import { ConfirmModal } from "../ui/ConfirmModal";
import { Footer } from "../ui/Footer";
import { Header } from "../ui/Header";
import { HelpModal } from "../ui/HelpModal";
import { PackageDetails } from "../ui/PackageDetails";
import { PackageList } from "../ui/PackageList";
import { PickerModal } from "../ui/PickerModal";
import { RepoSearchModal } from "../ui/RepoSearchModal";
import { Spinner } from "../ui/Spinner";
import { TextInputModal } from "../ui/TextInputModal";

type ModalType = "none" | "snapshotList" | "snapshotCreate" | "help" | "repoSearch" | "installConfirm";

function defaultSnapshotName(): string {
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const time = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
  return `snapshot-${date}-${time}`;
}

export function App() {
  const renderer = useRenderer();
  const {
    state,
    visiblePackages,
    selectedPackage,
    refresh,
    moveSelection,
    toggleChecked,
    toggleAllVisible,
    toggleSafeMode,
    runUpgrade,
    runInstallPackage,
    makeSnapshot,
    refreshSnapshots,
    runRollback,
  } = useBrewkeeperState();

  const [modal, setModal] = useState<ModalType>("none");
  const [modalIndex, setModalIndex] = useState(0);
  const [snapshotNameDraft, setSnapshotNameDraft] = useState(defaultSnapshotName());
  const [repoQuery, setRepoQuery] = useState("");
  const [repoResults, setRepoResults] = useState<HomebrewSearchResult[]>([]);
  const [repoLoading, setRepoLoading] = useState(false);
  const [repoError, setRepoError] = useState<string | null>(null);
  const [repoSelectedIndex, setRepoSelectedIndex] = useState(0);
  const [repoPreview, setRepoPreview] = useState<HomebrewPackagePreview | null>(null);
  const [repoPreviewLoading, setRepoPreviewLoading] = useState(false);
  const [repoPreviewError, setRepoPreviewError] = useState<string | null>(null);
  const [pendingInstall, setPendingInstall] = useState<HomebrewSearchResult | null>(null);
  const searchRequestId = useRef(0);
  const previewRequestId = useRef(0);

  const selectedVisibleCount = selectedCount(visiblePackages, state.checked);

  const snapshotOptions = useMemo(
    () => state.snapshots.map((s) => `${s.name} (${s.createdAt.split("T")[0]})`),
    [state.snapshots],
  );
  const selectedRepoResult = repoResults[repoSelectedIndex] ?? null;

  useEffect(() => {
    if (modal !== "repoSearch") {
      return;
    }

    const query = repoQuery.trim();
    if (query.length < 2) {
      setRepoResults([]);
      setRepoLoading(false);
      setRepoError(null);
      setRepoSelectedIndex(0);
      return;
    }

    const id = ++searchRequestId.current;
    setRepoLoading(true);
    setRepoError(null);
    const timer = setTimeout(() => {
      void searchHomebrewPackages(query)
        .then((results) => {
          if (searchRequestId.current !== id) {
            return;
          }
          setRepoResults(results);
          setRepoSelectedIndex(0);
        })
        .catch((error) => {
          if (searchRequestId.current !== id) {
            return;
          }
          const message = error instanceof Error ? error.message : "Failed to search Homebrew.";
          setRepoError(message);
          setRepoResults([]);
          setRepoSelectedIndex(0);
        })
        .finally(() => {
          if (searchRequestId.current === id) {
            setRepoLoading(false);
          }
        });
    }, 180);

    return () => {
      clearTimeout(timer);
    };
  }, [modal, repoQuery]);

  useEffect(() => {
    if (modal !== "repoSearch" || !selectedRepoResult) {
      setRepoPreview(null);
      setRepoPreviewLoading(false);
      setRepoPreviewError(null);
      return;
    }

    const id = ++previewRequestId.current;
    setRepoPreviewLoading(true);
    setRepoPreviewError(null);
    void loadHomebrewPackagePreview(selectedRepoResult)
      .then((preview) => {
        if (previewRequestId.current !== id) {
          return;
        }
        setRepoPreview(preview);
      })
      .catch((error) => {
        if (previewRequestId.current !== id) {
          return;
        }
        const message = error instanceof Error ? error.message : "Failed to load package preview.";
        setRepoPreview(null);
        setRepoPreviewError(message);
      })
      .finally(() => {
        if (previewRequestId.current === id) {
          setRepoPreviewLoading(false);
        }
      });
  }, [modal, selectedRepoResult]);

  useKeyboard((key) => {
    if (key.ctrl && key.name === "c") {
      renderer.destroy();
      return;
    }

    // Modal navigation
    if (modal !== "none") {
      if (modal === "installConfirm") {
        if (key.name === "escape" || key.name === "n" || key.name === "q") {
          setModal("repoSearch");
          return;
        }
        if (key.name === "enter" || key.name === "y") {
          if (pendingInstall && !state.busy) {
            void runInstallPackage(pendingInstall);
          }
          setModal("repoSearch");
          return;
        }
        return;
      }

      if (key.name === "escape") {
        setModal("none");
        return;
      }
      if ((modal === "help" || modal === "snapshotList") && key.name === "q") {
        setModal("none");
        return;
      }
      const listModal = modal === "snapshotList" || modal === "repoSearch";

      if (listModal && (key.name === "up" || key.name === "k")) {
        if (modal === "repoSearch") {
          setRepoSelectedIndex((prev) => Math.max(0, prev - 1));
        } else {
          setModalIndex((prev) => Math.max(0, prev - 1));
        }
        return;
      }
      if (listModal && (key.name === "down" || key.name === "j")) {
        if (modal === "repoSearch") {
          setRepoSelectedIndex((prev) => Math.min(Math.max(0, repoResults.length - 1), prev + 1));
        } else {
          const max = snapshotOptions.length;
          setModalIndex((prev) => Math.min(Math.max(0, max - 1), prev + 1));
        }
        return;
      }
      if (key.name === "enter") {
        if (modal === "snapshotList") {
          const snapshot = state.snapshots[modalIndex];
          if (snapshot) void runRollback(snapshot);
        } else if (modal === "snapshotCreate") {
          void makeSnapshot(snapshotNameDraft);
          setSnapshotNameDraft(defaultSnapshotName());
        } else if (modal === "repoSearch") {
          const selected = repoResults[repoSelectedIndex] ?? null;
          if (selected && !state.busy) {
            setPendingInstall(selected);
            setModal("installConfirm");
          }
          return;
        } else if (modal === "help") {
          // Close help on enter for convenience.
        }
        setModal("none");
      }
      if (modal === "repoSearch" && key.name === "i") {
        if (selectedRepoResult && !state.busy) {
          setPendingInstall(selectedRepoResult);
          setModal("installConfirm");
        }
        return;
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
    if (key.name === "f") {
      setRepoQuery("");
      setRepoResults([]);
      setRepoError(null);
      setRepoLoading(false);
      setRepoSelectedIndex(0);
      setRepoPreview(null);
      setRepoPreviewLoading(false);
      setRepoPreviewError(null);
      setPendingInstall(null);
      setModal("repoSearch");
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
      setSnapshotNameDraft(defaultSnapshotName());
      setModal("snapshotCreate");
      return;
    }
    if (key.name === "v") {
      void refreshSnapshots();
      setModalIndex(0);
      setModal("snapshotList");
      return;
    }
    if (key.name === "?" || (key.shift && key.name === "/")) {
      setModal("help");
      return;
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
        visibleCount={visiblePackages.length}
        totalCount={state.packages.length}
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
        visible={modal === "snapshotList"}
        title="Rollback to Snapshot"
        options={snapshotOptions}
        selectedIndex={modalIndex}
      />
      <TextInputModal
        visible={modal === "snapshotCreate"}
        title="Create Snapshot"
        description="Name your snapshot before saving the Brewfile state."
        value={snapshotNameDraft}
        placeholder="snapshot name..."
        helperText="enter save snapshot | esc close"
        readyStatusText="name ready"
        emptyStatusText="uses timestamp name"
        onChange={setSnapshotNameDraft}
      />
      <RepoSearchModal
        visible={modal === "repoSearch"}
        query={repoQuery}
        loading={repoLoading}
        error={repoError}
        selectedIndex={repoSelectedIndex}
        results={repoResults}
        preview={repoPreview}
        previewLoading={repoPreviewLoading}
        previewError={repoPreviewError}
        onChangeQuery={setRepoQuery}
      />
      <ConfirmModal
        visible={modal === "installConfirm"}
        title="Install Package"
        message={pendingInstall ? `Install ${pendingInstall.name} (${pendingInstall.type}) now?` : "Install package?"}
        details="This will run brew install and then refresh your outdated package list."
      />
      <HelpModal visible={modal === "help"} />
    </box>
  );
}
