interface FooterProps {
  statusMessage: string;
  error: string | null;
  selectedCount: number;
  visibleCount: number;
}

function Hint({ k, label }: { k: string; label: string }) {
  return (
    <text>
      <span fg="#7aa2f7">{k}</span>
      <span fg="#8690b3"> {label}  </span>
    </text>
  );
}

export function Footer({ statusMessage, error, selectedCount, visibleCount }: FooterProps) {
  return (
    <box flexDirection="column" height={3}>
      <box paddingLeft={1}>
        <text fg={error ? "#f7768e" : "#8690b3"}>
          {error ? `error: ${error}` : statusMessage}
        </text>
      </box>
      <box paddingLeft={1} flexDirection="row" flexWrap="wrap">
        <Hint k="j/k" label="navigate" />
        <Hint k="space" label="select" />
        <Hint k="a" label="select all" />
        <Hint k="u" label="upgrade selected" />
        <Hint k="s" label="toggle safe mode" />
        <Hint k="b" label="snapshot" />
        <Hint k="r" label="refresh" />
        <Hint k="q" label="quit" />
        <text fg="#6b7089"> | {selectedCount}/{visibleCount} selected</text>
      </box>
    </box>
  );
}
