import { createEffect, createSignal } from "solid-js";
import LogoIcon from "./LogoIcon";

export function IntroInfo(props: { openOptions: () => void; hide: boolean }) {
  const [showIntro, setShowIntro] = createSignal(true);
  setTimeout(() => {
    setShowIntro(false);
  }, 5000);

  createEffect(() => {
    if (props.hide && showIntro()) {
      setShowIntro(false);
    }
  });

  return (
    <div
      class="fixed left-3 bg-white shadow-lg rounded-lg py-1 px-2 pt-2 border-2 border-red-500 transition-all pointer-events-auto"
      style={{
        // position: "fixed",
        bottom: showIntro() ? "12px" : "-80px",
        // left: "10px",
        // background: "rgba(255,255,255)",
        // padding: "4px 8px",
        // "padding-top": "10px",
        // "box-shadow":
        //   "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1), 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        // "border-radius": "8px",
        // border: "red 2px solid",
        // transition: "all 0.3s ease-in-out",
      }}
    >
      <div class="flex justify-between gap-2">
        <LogoIcon />
        <button
          onClick={() => {
            props.openOptions();
          }}
          class="bg-slate-100 py-1 px-2 rounded hover:bg-slate-300 active:bg-slate-400 cursor-pointer text-xs"
        >
          Settings
        </button>
      </div>
      <div>option + click: go to component code</div>
    </div>
  );
}
