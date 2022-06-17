import { createSignal, onCleanup } from "solid-js";
import { render, template } from "solid-js/web";
import { isCombinationModifiersPressed } from "./isCombinationModifiersPressed";

console.log({ template });

function Runtime() {
  const [solidMode, setSolidMode] = createSignal<null | "xray">(null);

  function globalKeyUpListener(e: KeyboardEvent) {
    if (e.code === "KeyO" && isCombinationModifiersPressed(e)) {
      setSolidMode("xray");
    }
  }

  document.addEventListener("keyup", globalKeyUpListener);

  onCleanup(() => {
    document.removeEventListener("keyup", globalKeyUpListener);
  });

  return <div>SOLID RUNTIME!!! mode: {solidMode}</div>;
}

export function initRender(solidLayer: HTMLDivElement) {
  render(() => <Runtime />, solidLayer);
}
