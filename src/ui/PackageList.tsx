import type { PackageViewModel } from "../domain/types";

interface PackageListProps {
  packages: PackageViewModel[];
  selectedIndex: number;
  checked: Record<string, boolean>;
}

function bumpLabel(bump: string): string {
  switch (bump) {
    case "major": return "MAJOR upgrade";
    case "minor": return "minor upgrade";
    case "patch": return "patch fix";
    default: return "unknown change";
  }
}

function riskFg(level: string): string {
  switch (level) {
    case "high": return "#f7768e";
    case "medium": return "#e0af68";
    default: return "#9ece6a";
  }
}

function riskWord(level: string): string {
  switch (level) {
    case "high": return "risky";
    case "medium": return "caution";
    default: return "safe";
  }
}

export function PackageList({ packages, selectedIndex, checked }: PackageListProps) {
  return (
    <box
      flexDirection="column"
      flexGrow={1}
      border
      borderStyle="rounded"
      borderColor="#505878"
      title=" Packages "
      titleAlignment="left"
    >
      {packages.length === 0 ? (
        <box padding={2} justifyContent="center" alignItems="center" flexGrow={1} flexDirection="column">
          <text fg="#8690b3">No packages to upgrade right now.</text>
          <text fg="#6b7089">Press r to refresh or s to toggle safe mode.</text>
        </box>
      ) : (
        <scrollbox focused flexGrow={1}>
          {packages.map((entry, index) => {
            const active = index === selectedIndex;
            const isChecked = checked[entry.pkg.name];
            const cursor = active ? ">" : " ";
            const check = isChecked ? "x" : " ";
            const deps = entry.risk.dependencyImpactCount;

            return (
              <box
                key={entry.pkg.name}
                backgroundColor={active ? "#1a1b26" : "transparent"}
                paddingLeft={1}
                paddingRight={1}
                flexDirection="column"
              >
                <text>
                  <span fg={active ? "#7aa2f7" : "#6b7089"}>{cursor}</span>
                  {" "}
                  <span fg={isChecked ? "#9ece6a" : "#6b7089"}>[{check}]</span>
                  {" "}
                  <span fg={active ? "#c0caf5" : "#a9b1d6"}><strong>{entry.pkg.name}</strong></span>
                  {entry.pkg.type === "cask" && <span fg="#6b7089"> (cask)</span>}
                </text>
                <text>
                  <span fg="#6b7089">{"     "}</span>
                  <span fg="#8690b3">{entry.pkg.currentVersion}</span>
                  <span fg="#6b7089">{" -> "}</span>
                  <span fg="#c0caf5">{entry.pkg.latestVersion}</span>
                  <span fg="#6b7089">{"  "}</span>
                  <span fg={riskFg(entry.risk.level)}>{bumpLabel(entry.risk.bump)}</span>
                  <span fg="#6b7089">{"  "}</span>
                  <span fg="#8690b3">{riskWord(entry.risk.level)}</span>
                  {deps > 0 && (
                    <span fg="#6b7089">{`  ${deps} affected`}</span>
                  )}
                </text>
              </box>
            );
          })}
        </scrollbox>
      )}
    </box>
  );
}
