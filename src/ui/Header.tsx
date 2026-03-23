interface HeaderProps {
  safeModeOnly: boolean;
  loading: boolean;
  busy: boolean;
  visibleCount: number;
  totalCount: number;
}

export function Header({
  safeModeOnly,
  loading,
  busy,
  visibleCount,
  totalCount,
}: HeaderProps) {
  const status = busy ? "WORKING" : loading ? "LOADING" : "READY";
  const statusColor = busy ? "#bb9af7" : loading ? "#e0af68" : "#9ece6a";
  const modeLabel = safeModeOnly ? "SAFE" : "ALL";
  const modeColor = safeModeOnly ? "#9ece6a" : "#7aa2f7";

  return (
    <box
      height={3}
      border
      borderStyle="rounded"
      borderColor="#4a5070"
      paddingLeft={2}
      paddingRight={2}
      flexDirection="row"
      alignItems="center"
    >
      <text>
        <span fg="#7aa2f7"><strong>BrewKeeper</strong></span>
      </text>
      <box flexGrow={1} />
      <text>
        <span fg="#6b7089">[</span>
        <span fg={modeColor}>{modeLabel}</span>
        <span fg="#6b7089">]</span>
      </text>
      <box width={1} />
      <text>
        <span fg="#6b7089">[</span>
        <span fg="#c0caf5">{visibleCount}/{totalCount}</span>
        <span fg="#6b7089">]</span>
      </text>
      <box width={1} />
      <text>
        <span fg="#6b7089">[</span>
        <span fg={statusColor}>{status}</span>
        <span fg="#6b7089">]</span>
      </text>
    </box>
  );
}
