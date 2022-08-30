import { allTargets, Target } from "@locator/shared";
import { AdapterId, fontFamily } from "./consts";
import generatedStyles from "./_generated_styles";
import { MAX_ZINDEX } from "./index";
import { setInternalProjectPath } from "./functions/buildLink";

export function initRuntime({
  adapter,
  targets,
  projectPath,
}: {
  adapter?: AdapterId;
  targets?: { [k: string]: Target | string };
  projectPath?: string;
} = {}) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  if (document.getElementById("locatorjs-wrapper")) {
    // already initialized
    return;
  }

  if (projectPath) {
    setInternalProjectPath(projectPath);
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

  // This weird import is needed because:
  // SSR React (Next.js) breaks when importing any SolidJS compiled file, so the import has to be conditional
  // Browser Extension breaks when importing with "import()"
  // Vite breaks when importing with "require()"
  if (typeof require !== "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { initRender } = require("./components/Runtime");
    initRender(layer, adapter, targets || allTargets);
  } else {
    import("./components/Runtime").then(({ initRender }) => {
      initRender(layer, adapter, targets || allTargets);
    });
  }
}
