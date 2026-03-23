interface TextInputModalProps {
  visible: boolean;
  title: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}

export function TextInputModal({
  visible,
  title,
  value,
  placeholder,
  onChange,
}: TextInputModalProps) {
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
        width={64}
        flexDirection="column"
        padding={1}
      >
        <box flexDirection="row" alignItems="center">
          <text>
            <span fg="#7aa2f7"><strong>{title}</strong></span>
          </text>
          <box flexGrow={1} />
          <text>
            <span fg="#6b7089">[</span>
            <span fg="#7aa2f7">enter</span>
            <span fg="#6b7089"> save]</span>
            <span fg="#6b7089"> [</span>
            <span fg="#7aa2f7">esc</span>
            <span fg="#6b7089"> close]</span>
          </text>
        </box>
        <box height={1} />
        <input
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          focused
          width="100%"
          backgroundColor="#16161e"
          focusedBackgroundColor="#1f2335"
          textColor="#c0caf5"
          cursorColor="#7aa2f7"
          placeholderColor="#6b7089"
        />
      </box>
    </box>
  );
}
