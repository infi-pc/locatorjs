import { JSX } from "solid-js";
import { Link, SquareCode } from "lucide-solid";
import cursorIcon from "./assets/editor-icons/cursor.svg";
import neovimIcon from "./assets/editor-icons/neovim.svg";
import vscodeIcon from "./assets/editor-icons/vscode.svg";
import webstormIcon from "./assets/editor-icons/webstorm.png";
import windsurfIcon from "./assets/editor-icons/windsurf.svg";

const styles = {
  icon: {
    width: "16px",
    height: "16px",
    display: "inline-block",
    "flex-shrink": 0,
    "object-fit": "contain",
  } satisfies JSX.CSSProperties,
};

const editorIcons = {
  vscode: { src: vscodeIcon, label: "Visual Studio Code" },
  cursor: { src: cursorIcon, label: "Cursor" },
  webstorm: { src: webstormIcon, label: "WebStorm" },
  windsurf: { src: windsurfIcon, label: "Windsurf" },
  nvim: { src: neovimIcon, label: "Neovim" },
} as const;

function BrandIcon(props: { src: string; label: string }) {
  return (
    <img
      src={props.src}
      alt={props.label}
      draggable={false}
      width="16"
      height="16"
      style={styles.icon}
    />
  );
}

export function editorIconFor(id: string): JSX.Element {
  if (id === "custom") return <Link size={16} />;

  const icon = editorIcons[id as keyof typeof editorIcons];
  if (!icon) return <SquareCode size={16} />;

  return <BrandIcon src={icon.src} label={icon.label} />;
}
