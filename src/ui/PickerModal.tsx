interface PickerModalProps {
  title: string;
  options: string[];
  selectedIndex: number;
  visible: boolean;
}

export function PickerModal({ title, options, selectedIndex, visible }: PickerModalProps) {
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
        width={44}
        flexDirection="column"
        padding={1}
      >
        <text>
          <span fg="#7aa2f7"><strong>{title}</strong></span>
        </text>
        <text fg="#6b7089">j/k navigate | enter confirm | esc close</text>
        <box height={1} />
        {options.length === 0 ? (
          <text fg="#8690b3">No options.</text>
        ) : (
          options.map((option, index) => {
            const active = index === selectedIndex;
            return (
              <text key={`${option}-${index}`}>
                <span fg={active ? "#7aa2f7" : "#6b7089"}>{active ? ">" : " "}</span>
                {" "}
                <span fg={active ? "#c0caf5" : "#a9b1d6"}>{option}</span>
              </text>
            );
          })
        )}
      </box>
    </box>
  );
}
