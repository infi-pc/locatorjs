import { getOwner, onCleanup } from "solid-js";
import {
  deserializePatch,
  type BindingAction,
  type LocatorOptions,
} from "@locator/shared";
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
  clearSiteLocal: () => ReturnType<OptionsStore["clearUserOrigin"]>;
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
        postMessageOrigin()
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
        postMessageOrigin()
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
        postMessageOrigin()
      );
      return;
    }

    if (data.type === "LOCATOR_PAGE_TRY_ACTION") {
      const action = validBindingAction(data.action);
      const result = !action
        ? { ok: false as const, reason: "invalid-action" }
        : options.effective().disabled
        ? { ok: false as const, reason: "disabled" }
        : { ok: true as const };
      if (result.ok) {
        window.dispatchEvent(
          new CustomEvent<BindingAction>("locatorjs:try-action", {
            detail: action!,
          })
        );
      }
      window.postMessage(
        {
          type: "LOCATOR_PAGE_TRY_ACTION_RESULT",
          requestId: data.requestId,
          result,
        },
        postMessageOrigin()
      );
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

function postMessageOrigin() {
  return window.location.origin === "null" ? "*" : window.location.origin;
}

function validBindingAction(value: unknown): BindingAction | undefined {
  if (!value || typeof value !== "object") return undefined;
  const action = value as Record<string, unknown>;
  switch (action.kind) {
    case "copy-path":
    case "show-tree":
    case "show-parents":
      return { kind: action.kind };
    case "copy-prompt":
      return typeof action.template === "string" ||
        action.template === undefined
        ? {
            kind: "copy-prompt",
            template: action.template as string | undefined,
          }
        : undefined;
    case "open-prompt":
      return (action.app === "cursor" || action.app === "windsurf") &&
        (typeof action.template === "string" || action.template === undefined)
        ? {
            kind: "open-prompt",
            app: action.app,
            template: action.template as string | undefined,
          }
        : undefined;
    case "open-editor":
      return (typeof action.targetId === "string" ||
        action.targetId === undefined) &&
        (typeof action.targetTemplate === "string" ||
          action.targetTemplate === undefined)
        ? {
            kind: "open-editor",
            targetId: action.targetId as string | undefined,
            targetTemplate: action.targetTemplate as string | undefined,
          }
        : undefined;
    default:
      return undefined;
  }
}
