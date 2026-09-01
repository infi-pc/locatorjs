import { postMessageOrigin, strictConfig } from "@locator/shared";
import type { OptionsStore } from "./optionsStore";

type RuntimeBridge = {
  getSnapshot: () => {
    effective: strictConfig.EffectiveOptionsView;
    provenance: ReturnType<OptionsStore["provenance"]>;
    layers: ReturnType<OptionsStore["layers"]>;
    allTargets: ReturnType<OptionsStore["allTargets"]>;
  };
  applySiteLocal: (
    patch: strictConfig.LayerPatchInput
  ) => ReturnType<OptionsStore["setUserOrigin"]>;
  clearSiteLocal: () => ReturnType<OptionsStore["clearUserOrigin"]>;
};

declare global {
  interface Window {
    __LOCATOR_RUNTIME__?: RuntimeBridge;
  }
}

let unmountCurrentBridge: (() => void) | undefined;

export function mountRuntimePopupBridge(options: OptionsStore) {
  if (typeof window === "undefined") return () => undefined;
  unmountCurrentBridge?.();

  const bridge: RuntimeBridge = {
    getSnapshot: () => ({
      effective: strictConfig.effectiveOptionsView(options.effective()),
      provenance: options.provenance(),
      layers: options.layers(),
      allTargets: options.allTargets(),
    }),
    applySiteLocal: (patch) => options.setUserOrigin(patch),
    clearSiteLocal: () => options.clearUserOrigin(),
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
        postMessageOrigin(window.location)
      );
      return;
    }

    if (data.type === "LOCATOR_PAGE_SITE_LOCAL_WRITE") {
      const result = await bridge.applySiteLocal({
        set: data.set ?? {},
        unset: data.unset ?? [],
      });
      window.postMessage(
        {
          type: "LOCATOR_PAGE_SITE_LOCAL_WRITE_RESULT",
          requestId: data.requestId,
          result,
        },
        postMessageOrigin(window.location)
      );
      return;
    }

    if (data.type === "LOCATOR_PAGE_SITE_LOCAL_CLEAR") {
      const result = await bridge.clearSiteLocal();
      window.postMessage(
        {
          type: "LOCATOR_PAGE_SITE_LOCAL_CLEAR_RESULT",
          requestId: data.requestId,
          result,
        },
        postMessageOrigin(window.location)
      );
      return;
    }

    if (data.type === "LOCATOR_PAGE_TRY_ACTION") {
      const parsed = strictConfig.parseAction(data.action);
      const result = !parsed.ok
        ? { ok: false as const, reason: "invalid-action" }
        : options.effective().disabled
        ? { ok: false as const, reason: "disabled" }
        : { ok: true as const };
      if (result.ok && parsed.ok) {
        window.dispatchEvent(
          new CustomEvent<strictConfig.ConfiguredAction>(
            "locatorjs:try-action",
            { detail: parsed.value }
          )
        );
      }
      window.postMessage(
        {
          type: "LOCATOR_PAGE_TRY_ACTION_RESULT",
          requestId: data.requestId,
          result,
        },
        postMessageOrigin(window.location)
      );
    }
  };

  window.addEventListener("message", onMessage);

  const unmount = () => {
    window.removeEventListener("message", onMessage);
    if (window.__LOCATOR_RUNTIME__ === bridge) {
      delete window.__LOCATOR_RUNTIME__;
    }
    if (unmountCurrentBridge === unmount) unmountCurrentBridge = undefined;
  };
  unmountCurrentBridge = unmount;
  return unmount;
}

export type RuntimeTryAction = strictConfig.BindingAction;
