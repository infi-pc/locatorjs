import { strictConfig } from "@locator/shared";
import { fontFamily, MAX_ZINDEX } from "./consts";
import { effectiveBindings, matchesActivation } from "./functions/bindings";
import { listenToFrameModifiers } from "./functions/crossFrameModifiers";
import { resolveEventTarget } from "./functions/resolveEventTarget";
import { initOptions } from "./functions/optionsStore";
import { mountRuntimePopupBridge } from "./functions/popupBridge";
import { installShadowRootTracking } from "./functions/shadowRoots";

let shellInstalled = false;
let cleanupShell: (() => void) | undefined;

export function __resetRuntimeForTesting() {
  cleanupShell?.();
  cleanupShell = undefined;
  shellInstalled = false;
}

export function initRuntime() {
  if (
    shellInstalled ||
    typeof window === "undefined" ||
    typeof document === "undefined" ||
    document.getElementById("locatorjs-wrapper")
  ) {
    return;
  }
  shellInstalled = true;

  // The settings bridge stays in the startup shell so the popup can inspect,
  // edit and enable a page without paying for the visual runtime.
  const options = initOptions();
  const unmountPopupBridge = mountRuntimePopupBridge(options);
  const syncDisabledMarker = () => {
    if (!document.head) return;
    if (options.effective().disabled) {
      document.head.dataset.locatorDisabled = "disabled";
    } else {
      delete document.head.dataset.locatorDisabled;
    }
  };
  const stopSyncingDisabledMarker = options.subscribe(syncDisabledMarker);
  syncDisabledMarker();

  let loading = false;
  let pendingTryAction: strictConfig.ConfiguredAction | undefined;
  let initialActivation: { held: boolean; target?: HTMLElement } | undefined;

  const bindings = () => effectiveBindings(options.effective());

  const activate = (activation?: { held: boolean; target?: HTMLElement }) => {
    if (activation) initialActivation = activation;
    if (loading || options.effective().disabled) return;
    if (!document.body || !document.head) return;
    loading = true;
    removeGestureListeners();

    installShadowRootTracking();
    const { layer, wrapper, globalStyle } = createRuntimeLayer();
    import(/* webpackChunkName: "locator-runtime-ui" */ "./components/Runtime")
      .then(({ initRender }) => {
        initRender(layer, options, {
          activation: initialActivation,
          tryAction: pendingTryAction,
        });
        window.removeEventListener("locatorjs:try-action", onTryAction);
      })
      .catch(() => {
        loading = false;
        wrapper.remove();
        globalStyle.remove();
        installGestureListeners();
      });
  };

  const onGesture = (event: KeyboardEvent | MouseEvent) => {
    if (!matchesActivation(bindings(), event)) return;
    activate({
      held: true,
      target:
        event instanceof MouseEvent
          ? resolveEventTarget(event) ?? undefined
          : undefined,
    });
  };
  const onTryAction = (event: Event) => {
    pendingTryAction = (event as CustomEvent<strictConfig.ConfiguredAction>)
      .detail;
    activate();
  };
  let stopFrameModifiers: () => void = () => undefined;

  function installGestureListeners() {
    document.addEventListener("keydown", onGesture);
    document.addEventListener("mouseover", onGesture, { capture: true });
    stopFrameModifiers = listenToFrameModifiers((modifiers) => {
      if (matchesActivation(bindings(), modifiers)) {
        activate({ held: true });
      }
    });
  }

  function removeGestureListeners() {
    document.removeEventListener("keydown", onGesture);
    document.removeEventListener("mouseover", onGesture, { capture: true });
    stopFrameModifiers();
  }

  window.addEventListener("locatorjs:try-action", onTryAction);
  installGestureListeners();
  cleanupShell = () => {
    removeGestureListeners();
    window.removeEventListener("locatorjs:try-action", onTryAction);
    stopSyncingDisabledMarker();
    unmountPopupBridge();
    options.dispose();
    document.getElementById("locatorjs-wrapper")?.remove();
    document.getElementById("locatorjs-global-style")?.remove();
  };
}

function createRuntimeLayer() {
  const style = document.createElement("style");
  style.id = "locatorjs-style";
  style.textContent = `
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
  globalStyle.textContent = `
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
  wrapper.id = "locatorjs-wrapper";
  const shadow = wrapper.attachShadow({ mode: "open" });
  const layer = document.createElement("div");
  layer.id = "locatorjs-layer";
  shadow.append(style, layer);
  document.body.appendChild(wrapper);
  document.head.appendChild(globalStyle);
  return { layer, wrapper, globalStyle };
}
