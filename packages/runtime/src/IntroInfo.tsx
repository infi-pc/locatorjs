import { createSignal } from "solid-js";
import LogoIcon from "./LogoIcon";

export function IntroInfo() {
  const [showIntro, setShowIntro] = createSignal(true);
  setTimeout(() => {
    setShowIntro(false);
  }, 5000);
  return (
    <div
      style={{
        position: "fixed",
        bottom: showIntro() ? "10px" : "-80px",
        left: "10px",
        background: "rgba(255,255,255)",
        padding: "4px 8px",
        "padding-top": "10px",
        "box-shadow":
          "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1), 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        "border-radius": "8px",
        border: "red 2px solid",
        transition: "all 0.3s ease-in-out",
      }}
    >
      <LogoIcon />
      <div>option + click: go to component code</div>
    </div>
  );
}
