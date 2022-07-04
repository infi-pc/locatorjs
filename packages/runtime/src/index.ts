import { Target } from "@locator/shared";
import { Adapter, baseColor, fontFamily, hoverColor } from "./consts";
export * from "./runtimeStore";

// import only in browser, because when used as SSR (Next.js), SolidJS (solid-js/web) somehow breaks the page
const initRender =
  typeof window === "undefined" ? () => {} : require("./Runtime").initRender;

const isExtension =
  typeof document !== "undefined"
    ? !!document.documentElement.dataset.locatorClientUrl
    : false;

if (typeof window !== "undefined" && isExtension) {
  setTimeout(init, 0);
}

export function setup({
  adapter,
}: {
  adapter: Adapter;
  // defaultMode?: LocatorJSMode;
  // targets?: { [k: string]: Target | string };
}) {
  if (typeof window !== "undefined") {
    init({ adapter });
  }
  // if (props.defaultMode) {
  //   defaultMode = props.defaultMode;
  // }
  // if (props.targets) {
  //   allTargets = Object.fromEntries(
  //     Object.entries(props.targets).map(([key, target]) =>
  //       typeof target === "string"
  //         ? [key, { url: target, label: key }]
  //         : [key, target]
  //     )
  //   );
  //   const firstKey = Object.keys(allTargets)[0];
  //   if (!firstKey) {
  //     throw new Error("no targets found");
  //   }
  //   localLinkOrTemplate = firstKey;
  // }
}

function init({ adapter }: { adapter?: Adapter } = {}) {
  if (document.getElementById("locatorjs-wrapper")) {
    // already initialized
    return;
  }

  // add style tag to head
  const style = document.createElement("style");
  style.id = "locatorjs-style";
  style.innerHTML = `
      #locatorjs-layer {
        pointer-events: none;
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
    `;

  const globalStyle = document.createElement("style");
  globalStyle.id = "locatorjs-global-style";
  globalStyle.innerHTML = `
      #locatorjs-wrapper {
        z-index: 99999999;
        pointer-events: none;
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

  initRender(layer, adapter);
}
