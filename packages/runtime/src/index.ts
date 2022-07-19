import { allTargets, Target } from "@locator/shared";
import { Adapter, baseColor, fontFamily, hoverColor } from "./consts";
import { isExtension } from "./isExtension";
import { initRender } from "./Runtime";
export * from "./adapters/jsx/runtimeStore";
import generatedStyles from "./_generated_styles";

// Init in case it is used from extension
if (typeof window !== "undefined" && isExtension()) {
  setTimeout(() => init({ adapter: "auto" }), 0);
}

const MAX_ZINDEX = 2147483647;

export function setup({
  adapter,
  targets,
}: {
  adapter?: Adapter;
  // defaultMode?: LocatorJSMode;
  targets?: { [k: string]: Target | string };
} = {}) {
  setTimeout(() => init({ adapter, targets }), 0);
}

function init({
  adapter,
  targets,
}: {
  adapter?: Adapter | "auto";
  targets?: { [k: string]: Target | string };
} = {}) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  if (document.getElementById("locatorjs-wrapper")) {
    // already initialized
    return;
  }

  // add style tag to head
  const style = document.createElement("style");
  style.id = "locatorjs-style";
  style.innerHTML = `
      #locatorjs-layer {
        all: initial;
        pointer-events: none;
        font-family: ${fontFamily};
      }
      #locatorjs-layer * {
        box-sizing: border-box;
      }
      .locatorjs-label {
        cursor: pointer;
        background-color: ${baseColor};
        display: block;
        color: #fff;
        font-size: 12px;
        font-weight: bold;
        text-align: center;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: ${fontFamily};
        white-space: nowrap;
        text-decoration: none !important;
        line-height: 18px;
        pointer-events: auto;
      }
      .locatorjs-label:hover {
        background-color: ${hoverColor};
        color: #fff;
        text-decoration: none;
      }
      #locatorjs-labels-wrapper {
        display: flex;
        gap: 8px;
      }
      .locatorjs-tree-node:hover {
        background-color: #eee;
      }
      ${generatedStyles}
    `;

  const globalStyle = document.createElement("style");
  globalStyle.id = "locatorjs-global-style";
  globalStyle.innerHTML = `
      #locatorjs-wrapper {
        z-index: ${MAX_ZINDEX};
        pointer-events: none;
        position: fixed;
      }
      .locatorjs-active-pointer * {
        cursor: pointer !important;
      }
      body.locatorjs-move-body > * {
        transition: transform 0.2s ease-in-out;
        transform: scale(0.5) translate(50%, -50%);
      }
      body.locatorjs-move-body > * { 
        box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
      }
      body.locatorjs-move-body > #locatorjs-wrapper { 
        transform: scale(1);
        position: fixed;
        top: 0;
        left: 0;
      }
    `;

  const wrapper = document.createElement("div");
  wrapper.setAttribute("id", "locatorjs-wrapper");

  const shadow = wrapper.attachShadow({ mode: "open" });
  const layer = document.createElement("div");
  layer.setAttribute("id", "locatorjs-layer");

  // wrapper.appendChild(style);
  // wrapper.appendChild(layer);
  shadow.appendChild(style);
  shadow.appendChild(layer);

  document.body.appendChild(wrapper);
  document.head.appendChild(globalStyle);

  const finalAdapter: Adapter =
    adapter === "auto" || !adapter ? detectAdapter() : adapter;

  initRender(layer, finalAdapter, targets || allTargets);
}

export default setup;

function detectAdapter(): Adapter {
  if (document.querySelector("[data-locatorjs-id]")) {
    return "jsx";
  }
  return "reactDevTools";
}
