import { JSX } from "solid-js";
import { Link, SquareCode } from "lucide-solid";

const styles = {
  icon: {
    width: "16px",
    height: "16px",
    display: "inline-block",
    "flex-shrink": 0,
  } satisfies JSX.CSSProperties,
};

function Glyph(props: { label: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" style={styles.icon}>
      <rect width="16" height="16" rx="3" fill="currentColor" opacity="0.16" />
      <text
        x="8"
        y="11"
        text-anchor="middle"
        font-size="8"
        font-family="ui-sans-serif, system-ui"
        font-weight="700"
        fill="currentColor"
      >
        {props.label}
      </text>
    </svg>
  );
}

export function editorIconFor(id: string): JSX.Element {
  switch (id) {
    case "vscode":
      return <Glyph label="VS" />;
    case "cursor":
      return <Glyph label="C" />;
    case "webstorm":
      return <Glyph label="WS" />;
    case "windsurf":
      return <Glyph label="W" />;
    case "nvim":
      return <Glyph label="NV" />;
    case "custom":
      return <Link size={16} />;
    default:
      return <SquareCode size={16} />;
  }
}
