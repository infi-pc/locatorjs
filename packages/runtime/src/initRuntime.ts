import { fontFamily } from "./consts";
import { MAX_ZINDEX } from "./index";
import { installShadowRootTracking } from "./functions/shadowRoots";

export function initRuntime() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  if (document.getElementById("locatorjs-wrapper")) {
    // already initialized
    return;
  }

  // Done before anything else: closed shadow roots can only be tracked from the
  // moment `attachShadow` is patched, so the earlier the better.
  installShadowRootTracking();

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

  import(
    /* webpackChunkName: "locator-runtime-ui" */ "./components/Runtime"
  ).then(({ initRender }) => initRender(layer));
}
