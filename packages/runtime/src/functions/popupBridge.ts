import { getOwner, onCleanup } from "solid-js";
import { deserializePatch, type LocatorOptions } from "@locator/shared";
import type { OptionsStore } from "./optionsStore";

type RuntimeBridge = {
  getSnapshot: () => {
    effective: LocatorOptions;
    provenance: ReturnType<OptionsStore["provenance"]>;
    layers: ReturnType<OptionsStore["layers"]>;
    allTargets: ReturnType<OptionsStore["allTargets"]>;
  };
  applySiteLocal: (
    patch: Partial<LocatorOptions>
  ) => ReturnType<OptionsStore["setUserOrigin"]>;
};

declare global {
  interface Window {
    __LOCATOR_RUNTIME__?: RuntimeBridge;
  }
}

export function mountRuntimePopupBridge(options: OptionsStore) {
  if (typeof window === "undefined") return;

  const bridge: RuntimeBridge = {
    getSnapshot: () => ({
      effective: options.effective(),
      provenance: options.provenance(),
      layers: options.layers(),
      allTargets: options.allTargets(),
    }),
    applySiteLocal: (patch) => options.setUserOrigin(patch),
  };

  window.__LOCATOR_RUNTIME__ = bridge;

  const onMessage = async (event: MessageEvent) => {
    if (event.source !== window) return;
    const data = event.data;
    if (!data || typeof data !== "object") return;

    if (data.type === "LOCATOR_PAGE_SNAPSHOT_REQUEST") {
      window.postMessage(
        {
          type: "LOCATOR_PAGE_SNAPSHOT_RESPONSE",
          requestId: data.requestId,
          snapshot: bridge.getSnapshot(),
        },
        "*"
      );
      return;
    }

    if (data.type === "LOCATOR_PAGE_SITE_LOCAL_WRITE") {
      const result = await bridge.applySiteLocal(
        deserializePatch(data.patch ?? {}, data.unset)
      );
      window.postMessage(
        {
          type: "LOCATOR_PAGE_SITE_LOCAL_WRITE_RESULT",
          requestId: data.requestId,
          result,
        },
        "*"
      );
      return;
    }
  };

  window.addEventListener("message", onMessage);

  if (getOwner()) {
    onCleanup(() => {
      window.removeEventListener("message", onMessage);
      if (window.__LOCATOR_RUNTIME__ === bridge) {
        delete window.__LOCATOR_RUNTIME__;
      }
    });
  }
}
