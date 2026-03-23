interface HelpModalProps {
  visible: boolean;
}

const SECTIONS: Array<{
  title: string;
  items: Array<{ key: string; action: string }>;
}> = [
  {
    title: "Browse",
    items: [
      { key: "j / k", action: "Move through packages" },
      { key: "space", action: "Select package" },
      { key: "a", action: "Select or clear all visible" },
    ],
  },
  {
    title: "Search",
    items: [
      { key: "f", action: "Open Homebrew search" },
      { key: "i", action: "Install selected search result" },
    ],
  },
  {
    title: "Actions",
    items: [
      { key: "u", action: "Upgrade selected packages" },
      { key: "s", action: "Toggle safe mode" },
      { key: "b", action: "Create named snapshot" },
      { key: "v", action: "Open snapshot list" },
      { key: "Shift+R", action: "Open snapshot list (rollback)" },
      { key: "r", action: "Refresh package state" },
    ],
  },
  {
    title: "Close",
    items: [
      { key: "esc", action: "Close modal" },
      { key: "q", action: "Quit app" },
    ],
  },
];

export function HelpModal({ visible }: HelpModalProps) {
  if (!visible) return null;

  return (
    <box
      position="absolute"
      left={0}
      top={0}
      width="100%"
      height="100%"
      justifyContent="center"
      alignItems="center"
    >
      <box
        border
        borderStyle="rounded"
        borderColor="#7aa2f7"
        backgroundColor="#1a1b26"
        width={74}
        height="80%"
        flexDirection="column"
        padding={2}
      >
        <box flexDirection="row" alignItems="center">
          <text>
            <span fg="#7aa2f7">
              <strong>Keyboard Guide</strong>
            </span>
          </text>
          <box flexGrow={1} />
          <text>
            <span fg="#6b7089">[</span>
            <span fg="#7aa2f7">f</span>
            <span fg="#6b7089"> search] [</span>
            <span fg="#7aa2f7">u</span>
            <span fg="#6b7089"> upgrade] [</span>
            <span fg="#7aa2f7">b</span>
            <span fg="#6b7089"> snapshot]</span>
          </text>
        </box>
        <box height={1} />
        <scrollbox focused flexGrow={1}>
          {SECTIONS.map((section) => (
            <box key={section.title} flexDirection="column" paddingBottom={1}>
              <text>
                <span fg="#8690b3">
                  <strong>{section.title}</strong>
                </span>
              </text>
              {section.items.map((item) => (
                <text key={`${section.title}-${item.key}`}>
                  <span fg="#7aa2f7">{item.key.padEnd(8, " ")}</span>
                  <span fg="#6b7089"> </span>
                  <span fg="#a9b1d6">{item.action}</span>
                </text>
              ))}
              <box height={1} />
            </box>
          ))}
        </scrollbox>
        <text fg="#6b7089">
          tip: use <span fg="#7aa2f7">b</span> to create a named snapshot before
          major upgrades.
        </text>
      </box>
    </box>
  );
}
