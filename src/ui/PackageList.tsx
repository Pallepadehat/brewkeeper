import type { PackageViewModel } from "../domain/types";

interface PackageListProps {
  packages: PackageViewModel[];
  selectedIndex: number;
  checked: Record<string, boolean>;
}

function bumpLabel(bump: string): string {
  switch (bump) {
    case "major":
      return "major";
    case "minor":
      return "minor";
    case "patch":
      return "patch";
    default:
      return "unknown";
  }
}

function bumpFg(level: string): string {
  switch (level) {
    case "major":
      return "#f7768e";
    case "minor":
      return "#e0af68";
    case "patch":
      return "#9ece6a";
    default:
      return "#7dcfff";
  }
}

function riskWord(level: string): string {
  switch (level) {
    case "high":
      return "high";
    case "medium":
      return "medium";
    default:
      return "low";
  }
}

function riskFg(level: string): string {
  switch (level) {
    case "high":
      return "#f7768e";
    case "medium":
      return "#e0af68";
    default:
      return "#9ece6a";
  }
}

export function PackageList({
  packages,
  selectedIndex,
  checked,
}: PackageListProps) {
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
        <box
          padding={3}
          justifyContent="center"
          alignItems="center"
          flexGrow={1}
          flexDirection="column"
        >
          <text fg="#a9b1d6">
            No packages to upgrade right now.
          </text>
          <box height={1} />
          <text fg="#6b7089">
            Press r to refresh. Press f to search Homebrew repos.
          </text>
        </box>
      ) : (
        <scrollbox focused flexGrow={1}>
          <box height={1} />
          {packages.map((entry, index) => {
            const active = index === selectedIndex;
            const isChecked = checked[entry.pkg.name];
            const check = isChecked ? "x" : " ";
            const deps = entry.risk.dependencyImpactCount;

            return (
              <box
                key={entry.pkg.name}
                backgroundColor={active ? "#1f2335" : "transparent"}
                paddingLeft={2}
                paddingRight={2}
                paddingTop={index === 0 ? 1 : 1}
                paddingBottom={1}
                flexDirection="column"
              >
                <box
                  flexDirection="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <text>
                    <span fg={active ? "#7aa2f7" : "#6b7089"}>
                      {active ? ">" : " "}
                    </span>{" "}
                    <span fg={isChecked ? "#9ece6a" : "#6b7089"}>
                      [{check}]
                    </span>{" "}
                    <span fg={active ? "#c0caf5" : "#a9b1d6"}>
                      <strong>{entry.pkg.name}</strong>
                    </span>
                    {entry.pkg.type === "cask" && (
                      <>
                        <span fg="#6b7089">{"  ["}</span>
                        <span fg="#e0af68">cask</span>
                        <span fg="#6b7089">]</span>
                      </>
                    )}
                  </text>
                  <box flexDirection="row" gap={2} alignItems="flex-end">
                    <text>
                      <span fg="#8690b3">{entry.pkg.currentVersion}</span>
                      <span fg="#6b7089">{" -> "}</span>
                      <span fg="#c0caf5">{entry.pkg.latestVersion}</span>
                    </text>
                    <text>
                      <span fg="#6b7089">{"["}</span>
                      <span fg={bumpFg(entry.risk.bump)}>
                        {bumpLabel(entry.risk.bump)}
                      </span>
                      <span fg="#6b7089">{"] ["}</span>
                      <span fg={riskFg(entry.risk.level)}>
                        {riskWord(entry.risk.level)}
                      </span>
                      <span fg="#6b7089">]</span>
                      {deps > 0 && (
                        <>
                          <span fg="#6b7089">{" ["}</span>
                          <span fg="#bb9af7">{deps}</span>
                          <span fg="#6b7089"> deps]</span>
                        </>
                      )}
                    </text>
                  </box>
                </box>
              </box>
            );
          })}
        </scrollbox>
      )}
    </box>
  );
}
