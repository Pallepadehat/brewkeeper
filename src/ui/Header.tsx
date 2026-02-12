interface HeaderProps {
  safeModeOnly: boolean;
  loading: boolean;
  busy: boolean;
}

export function Header({ safeModeOnly, loading, busy }: HeaderProps) {
  const status = busy ? "working..." : loading ? "loading..." : "ready";

  return (
    <box
      height={3}
      border
      borderStyle="rounded"
      borderColor="#3a3a4a"
      paddingLeft={1}
      paddingRight={1}
      alignItems="center"
    >
      <box flexGrow={1}>
        <text>
          <span fg="#7aa2f7">
            <strong>BrewKeeper</strong>
          </span>
        </text>
      </box>
      <box>
        <text>
          <span fg={safeModeOnly ? "#9ece6a" : "#e0af68"}>
            {safeModeOnly ? "safe upgrades only" : "showing all"}
          </span>
          <span fg="#6b7089"> | </span>
          <span fg={status === "ready" ? "#8690b3" : "#bb9af7"}>{status}</span>
        </text>
      </box>
    </box>
  );
}
