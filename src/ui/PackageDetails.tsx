import type { PackageViewModel } from "../domain/types";

interface PackageDetailsProps {
  selectedPackage: PackageViewModel | null;
}

function clip(value: string | undefined, max: number): string {
  if (!value) return "n/a";
  return value.length <= max ? value : `${value.slice(0, max - 3)}...`;
}

function breakExplanation(likelyBreaking: boolean): string {
  return likelyBreaking
    ? "This update may introduce breaking changes to your setup."
    : "This update is unlikely to break anything.";
}

function bumpExplanation(bump: string): string {
  switch (bump) {
    case "major": return "Major version change. APIs or behavior may differ.";
    case "minor": return "New features added. Existing behavior should be stable.";
    case "patch": return "Bug fixes only. Very low risk update.";
    default: return "Version format is non-standard. Review manually.";
  }
}

export function PackageDetails({ selectedPackage }: PackageDetailsProps) {
  return (
    <box
      flexDirection="column"
      width="40%"
      border
      borderStyle="rounded"
      borderColor="#505878"
      title=" Details "
      titleAlignment="left"
    >
      {!selectedPackage ? (
        <box padding={2} justifyContent="center" alignItems="center" flexGrow={1} flexDirection="column">
          <text fg="#8690b3">Use j/k to browse packages.</text>
          <text fg="#6b7089">Details and risk info appear here.</text>
        </box>
      ) : (
        <scrollbox flexGrow={1}>
          {/* Package identity */}
          <box paddingLeft={1} paddingRight={1} paddingTop={1} flexDirection="column">
            <text>
              <span fg="#c0caf5"><strong>{selectedPackage.pkg.name}</strong></span>
            </text>
            <text>
              <span fg="#8690b3">{selectedPackage.pkg.currentVersion}</span>
              <span fg="#6b7089">{" -> "}</span>
              <span fg="#c0caf5">{selectedPackage.pkg.latestVersion}</span>
              <span fg="#6b7089">{"  ("}{selectedPackage.pkg.type}{")"}</span>
            </text>
          </box>

          {/* Risk summary */}
          <box paddingLeft={1} paddingRight={1} paddingTop={1} flexDirection="column">
            <text fg="#8690b3">Risk Assessment</text>
            <text>
              <span fg={selectedPackage.risk.likelyBreaking ? "#f7768e" : "#9ece6a"}>
                {selectedPackage.risk.likelyBreaking ? "Breaking likely" : "Safe to update"}
              </span>
            </text>
            <text fg="#6b7089">{breakExplanation(selectedPackage.risk.likelyBreaking)}</text>
          </box>

          {/* Version bump */}
          <box paddingLeft={1} paddingRight={1} paddingTop={1} flexDirection="column">
            <text fg="#8690b3">Version Bump</text>
            <text fg="#a9b1d6">{selectedPackage.risk.bump} version change</text>
            <text fg="#6b7089">{bumpExplanation(selectedPackage.risk.bump)}</text>
          </box>

          {/* Dependency impact */}
          <box paddingLeft={1} paddingRight={1} paddingTop={1} flexDirection="column">
            <text fg="#8690b3">Dependency Impact</text>
            {selectedPackage.risk.dependencyImpactCount === 0 ? (
              <text fg="#6b7089">No other installed packages depend on this.</text>
            ) : (
              <>
                <text fg="#e0af68">
                  {selectedPackage.risk.dependencyImpactCount} installed package(s) depend on this.
                </text>
                <text fg="#a9b1d6">
                  {clip(selectedPackage.risk.dependencyImpactPreview.join(", "), 54)}
                </text>
              </>
            )}
          </box>

          {/* Caveats */}
          {selectedPackage.risk.caveatWarning && (
            <box paddingLeft={1} paddingRight={1} paddingTop={1} flexDirection="column">
              <text fg="#8690b3">Homebrew Caveat</text>
              <text fg="#e0af68">{clip(selectedPackage.risk.caveatWarning, 54)}</text>
            </box>
          )}

          {/* Links */}
          {(selectedPackage.releaseLinks.homepage || selectedPackage.releaseLinks.releases) && (
            <box paddingLeft={1} paddingRight={1} paddingTop={1} flexDirection="column">
              <text fg="#8690b3">Links</text>
              {selectedPackage.releaseLinks.homepage && (
                <text fg="#7aa2f7">{clip(selectedPackage.releaseLinks.homepage, 54)}</text>
              )}
              {selectedPackage.releaseLinks.releases && (
                <text fg="#7aa2f7">{clip(selectedPackage.releaseLinks.releases, 54)}</text>
              )}
            </box>
          )}
        </scrollbox>
      )}
    </box>
  );
}
