import type {
  HomebrewPackagePreview,
  HomebrewSearchResult,
} from "../services/brew";

interface RepoSearchModalProps {
  visible: boolean;
  query: string;
  loading: boolean;
  error: string | null;
  selectedIndex: number;
  results: HomebrewSearchResult[];
  preview: HomebrewPackagePreview | null;
  previewLoading: boolean;
  previewError: string | null;
  onChangeQuery: (value: string) => void;
}

function typeColor(type: HomebrewSearchResult["type"]): string {
  return type === "cask" ? "#e0af68" : "#9ece6a";
}

function clip(value: string, max: number): string {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max - 3)}...`;
}

export function RepoSearchModal({
  visible,
  query,
  loading,
  error,
  selectedIndex,
  results,
  preview,
  previewLoading,
  previewError,
  onChangeQuery,
}: RepoSearchModalProps) {
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
        width="92%"
        height="85%"
        flexDirection="column"
        padding={1}
      >
        <box flexDirection="row" alignItems="center">
          <text>
            <span fg="#7aa2f7">
              <strong>Search Homebrew</strong>
            </span>
          </text>
          <box flexGrow={1} />
          <text>
            <span fg="#6b7089">[</span>
            <span fg="#7aa2f7">1</span>
            <span fg="#6b7089"> type </span>
            <span fg="#7aa2f7">2</span>
            <span fg="#6b7089"> pick </span>
            <span fg="#7aa2f7">3</span>
            <span fg="#6b7089"> enter/i</span>
            <span fg="#6b7089">]</span>
          </text>
        </box>
        <box height={1} />
        <box flexDirection="row" flexGrow={1}>
          <box
            width="42%"
            flexDirection="column"
            border
            borderStyle="rounded"
            borderColor="#505878"
            title=" Results "
            titleAlignment="left"
            padding={1}
          >
            <input
              value={query}
              onChange={onChangeQuery}
              placeholder="node, python, ffmpeg..."
              focused
              width="100%"
              backgroundColor="#16161e"
              focusedBackgroundColor="#1f2335"
              textColor="#c0caf5"
              cursorColor="#7aa2f7"
              placeholderColor="#6b7089"
            />
            <box height={1} />
            <text fg="#6b7089">
              <span fg="#7aa2f7">↵</span> install
              <span fg="#6b7089"> · </span>
              <span fg="#7aa2f7">i</span> install
            </text>
            <box height={1} />
            {error ? (
              <text fg="#f7768e">{clip(error, 80)}</text>
            ) : loading ? (
              <text fg="#8690b3">Searching...</text>
            ) : query.trim().length < 2 ? (
              <text fg="#6b7089">Type 2+ characters to search.</text>
            ) : results.length === 0 ? (
              <text fg="#6b7089">No matches found.</text>
            ) : (
              <scrollbox focused flexGrow={1}>
                {results.map((result, index) => {
                  const active = index === selectedIndex;
                  return (
                    <text key={`${result.type}:${result.name}`}>
                      <span fg={active ? "#7aa2f7" : "#6b7089"}>
                        {active ? "▸" : " "}
                      </span>
                      <span fg="#6b7089"> </span>
                      <span fg={typeColor(result.type)}>
                        {result.type === "formula" ? "f" : "c"}
                      </span>
                      <span fg="#6b7089">{"  "}</span>
                      <span fg={active ? "#c0caf5" : "#a9b1d6"}>
                        {result.name}
                      </span>
                    </text>
                  );
                })}
              </scrollbox>
            )}
          </box>
          <box width={2} />
          <box
            flexGrow={1}
            border
            borderStyle="rounded"
            borderColor="#505878"
            title=" Preview "
            titleAlignment="left"
            padding={1}
          >
            <scrollbox flexGrow={1}>
              {!preview && !previewLoading && !previewError ? (
                <box>
                  <text fg="#6b7089">
                    Pick a result to preview package info.
                  </text>
                </box>
              ) : previewLoading ? (
                <box>
                  <text fg="#8690b3">Loading package info...</text>
                </box>
              ) : previewError ? (
                <box>
                  <text fg="#f7768e">{clip(previewError, 120)}</text>
                </box>
              ) : preview ? (
                <box flexDirection="column">
                  <text>
                    <span fg="#c0caf5">
                      <strong>{preview.name}</strong>
                    </span>
                    <span fg="#6b7089">{"  ["}</span>
                    <span fg={typeColor(preview.type)}>{preview.type}</span>
                    <span fg="#6b7089">]</span>
                  </text>
                  {preview.description && (
                    <text fg="#a9b1d6">{preview.description}</text>
                  )}
                  <box height={1} />
                  <text>
                    <span fg="#6b7089">version </span>
                    <span fg="#c0caf5">
                      {preview.latestVersion ?? "unknown"}
                    </span>
                    <span fg="#6b7089"> installed </span>
                    <span fg={preview.installed ? "#9ece6a" : "#e0af68"}>
                      {preview.installed
                        ? clip(preview.installedVersions.join(", "), 30)
                        : "no"}
                    </span>
                  </text>
                  {preview.tap && (
                    <>
                      <box height={1} />
                      <text>
                        <span fg="#6b7089">tap </span>
                        <span fg="#a9b1d6">{preview.tap}</span>
                      </text>
                    </>
                  )}
                  {preview.homepage && (
                    <>
                      <box height={1} />
                      <text>
                        <span fg="#6b7089">homepage </span>
                        <span fg="#7aa2f7">{clip(preview.homepage, 72)}</span>
                      </text>
                    </>
                  )}
                  <box height={1} />
                  <text>
                    <span fg="#6b7089">dependencies </span>
                    {preview.dependencies.length > 0
                      ? preview.dependencies.join(", ")
                      : "none"}
                  </text>
                  {preview.caveats && (
                    <>
                      <box height={1} />
                      <text fg="#6b7089">caveats</text>
                      <text fg="#e0af68">{clip(preview.caveats, 180)}</text>
                    </>
                  )}
                </box>
              ) : null}
            </scrollbox>
          </box>
        </box>
        <box height={1} />
        <text fg="#6b7089">
          <span fg="#7aa2f7">esc</span> close
          <span fg="#6b7089"> · </span>
          <span fg="#7aa2f7">↑/↓</span> browse
          <span fg="#6b7089"> · </span>
          <span fg="#7aa2f7">↵</span> install
          <span fg="#6b7089"> · </span>
          <span fg="#7aa2f7">i</span> install
        </text>
      </box>
    </box>
  );
}
