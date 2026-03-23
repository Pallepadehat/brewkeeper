import { Spinner } from "./Spinner";

interface ProgressOverlayProps {
  visible: boolean;
  message: string;
}

export function ProgressOverlay({ visible, message }: ProgressOverlayProps) {
  if (!visible) return null;

  const label = message.trim().length > 0 ? message : "Working...";

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
        width={68}
        border
        borderStyle="rounded"
        borderColor="#7aa2f7"
        backgroundColor="#1a1b26"
        padding={1}
        flexDirection="column"
      >
        <Spinner label={label} />
      </box>
    </box>
  );
}
