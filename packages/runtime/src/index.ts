import { baseColor, fontFamily, hoverColor } from "./consts";
export * from "./runtimeStore";

// import only in browser, because when used as SSR (Next.js), SolidJS (solid-js/web) somehow breaks the page
const initRender =
  typeof window === "undefined" ? () => {} : require("./Runtime").initRender;

if (typeof window !== "undefined") {
  setTimeout(init, 0);
}

export function setup(props: {
  // defaultMode?: LocatorJSMode;
  // targets?: { [k: string]: Target | string };
}) {
  if (typeof window !== "undefined") {
    init();
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

function init() {
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
    `;

  const wrapper = document.createElement("div");
  wrapper.setAttribute("id", "locatorjs-wrapper");

  const shadow = wrapper.attachShadow({ mode: "closed" });
  const layer = document.createElement("div");
  layer.setAttribute("id", "locatorjs-layer");

  shadow.appendChild(style);
  shadow.appendChild(layer);

  document.body.appendChild(wrapper);

  initRender(layer);
}
