interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  details?: string;
}

export function ConfirmModal({ visible, title, message, details }: ConfirmModalProps) {
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
        borderColor="#e0af68"
        backgroundColor="#1a1b26"
        width={68}
        flexDirection="column"
        padding={1}
      >
        <text>
          <span fg="#e0af68"><strong>{title}</strong></span>
        </text>
        <box height={1} />
        <text fg="#c0caf5">{message}</text>
        {details && <text fg="#8690b3">{details}</text>}
        <box height={1} />
        <text fg="#6b7089">enter or y confirm | esc or n cancel</text>
      </box>
    </box>
  );
}
