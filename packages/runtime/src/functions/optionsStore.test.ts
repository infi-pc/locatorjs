// @vitest-environment jsdom
import { describe, expect, test, beforeEach, vi } from "vitest";
import { createRoot } from "solid-js";
import { allTargets, type Binding, type LocatorOptions } from "@locator/shared";
import {
  updateTeamLayer,
  setTeamTargets,
  __resetTeamLayerForTesting,
} from "./teamLayerStore";
import { initOptions } from "./optionsStore";
import { mountRuntimePopupBridge } from "./popupBridge";

function primaryModifiers(options: LocatorOptions) {
  const trigger = options.bindings?.find(
    (binding) => binding.trigger.kind === "modifier-click"
  )?.trigger;
  return trigger?.kind === "modifier-click" ? trigger.modifiers : undefined;
}

function editorBindings(targetId: string): Binding[] {
  return [
    {
      trigger: { kind: "modifier-click", modifiers: "alt" },
      action: { kind: "open-editor" as const, targetId },
    },
  ];
}

function primaryEditorTarget(options: LocatorOptions) {
  const action = options.bindings?.find(
    (binding) =>
      binding.trigger.kind === "modifier-click" &&
      binding.action.kind === "open-editor"
  )?.action;
  return action?.kind === "open-editor" ? action.targetId : undefined;
}

const disposers: (() => void)[] = [];

function withRoot<T>(fn: () => T): T {
  return createRoot((dispose) => {
    disposers.push(dispose);
    return fn();
  });
}

function setUserExtensionGlobal(options: unknown) {
  document.documentElement.dataset.locatorUserExtensionOptions =
    JSON.stringify(options);
}

function resetState() {
  while (disposers.length) disposers.pop()!();
  localStorage.clear();
  delete document.documentElement.dataset.locatorUserExtensionOptions;
  delete (window as unknown as Record<string, unknown>).__LOCATOR_RUNTIME__;
  delete (window as unknown as Record<string, unknown>).enableLocator;
  __resetTeamLayerForTesting();
}

describe("optionsStore integration", () => {
  beforeEach(() => {
    resetState();
  });

  test("late setup() updates team layer and re-drives resolver after init", async () => {
    const options = withRoot(() => initOptions());

    expect(options.effective().projectPath).toBeUndefined();

    updateTeamLayer({ projectPath: "/repo/late" });

    expect(options.effective().projectPath).toBe("/repo/late");
    expect(options.provenance().projectPath).toBe("team");
  });

  test("reads initial user-extension layer from documentElement dataset", async () => {
    setUserExtensionGlobal({ mouseModifiers: "ctrl" });

    const options = withRoot(() => initOptions());

    expect(primaryModifiers(options.effective())).toBe("ctrl");
    expect(options.provenance().bindings).toBe("user-extension");
  });

  test("postMessage updates user-extension layer after runtime mount", async () => {
    const options = withRoot(() => initOptions());

    expect(options.provenance().bindings).toBe("default");

    setUserExtensionGlobal({ mouseModifiers: "shift" });
    window.dispatchEvent(
      new MessageEvent("message", {
        data: { type: "LOCATOR_USER_EXTENSION_OPTIONS_UPDATED" },
        source: window,
      })
    );

    expect(primaryModifiers(options.effective())).toBe("shift");
    expect(options.provenance().bindings).toBe("user-extension");
  });

  test("user-origin layer overrides user-extension and team layers", async () => {
    updateTeamLayer({ bindings: editorBindings("vscode") });
    setUserExtensionGlobal({ bindings: editorBindings("cursor") });

    const options = withRoot(() => initOptions());
    await options.setUserOrigin({ bindings: editorBindings("webstorm") });

    expect(primaryEditorTarget(options.effective())).toBe("webstorm");
    expect(options.provenance().bindings).toBe("user-origin");
  });

  test("window.enableLocator() writes to user-origin layer only", async () => {
    const options = withRoot(() => initOptions());

    await options.setUserOrigin({ disabled: true });
    expect(options.effective().disabled).toBe(true);

    type WinWithEnable = { enableLocator?: () => Promise<{ ok: boolean }> };
    const result = await (window as unknown as WinWithEnable).enableLocator?.();

    expect(result).toEqual({ ok: true });
    expect(options.effective().disabled).toBe(false);
    expect(options.provenance().disabled).toBe("user-origin");
  });

  test("atomic replacePath merge across layers (later layer fully replaces)", async () => {
    updateTeamLayer({
      replacePath: { from: "/team/from", to: "/team/to" },
    });

    const options = withRoot(() => initOptions());
    await options.setUserOrigin({
      replacePath: { from: "/user/from", to: "/user/to" },
    });

    expect(options.effective().replacePath).toEqual({
      from: "/user/from",
      to: "/user/to",
    });
  });

  test("setUiState writes to uiState, not to LocatorOptions", async () => {
    const options = withRoot(() => initOptions());

    await options.setUiState({ welcomeScreenDismissed: true });

    expect(options.uiState().welcomeScreenDismissed).toBe(true);
    expect(
      (options.effective() as Record<string, unknown>).welcomeScreenDismissed
    ).toBeUndefined();
  });

  test("clearUserOrigin clears options while preserving uiState", async () => {
    setUserExtensionGlobal({ mouseModifiers: "ctrl" });
    const options = withRoot(() => initOptions());

    await options.setUserOrigin({ mouseModifiers: "shift" });
    await options.setUiState({ welcomeScreenDismissed: true });
    expect(primaryModifiers(options.effective())).toBe("shift");

    options.clearUserOrigin();

    expect(JSON.parse(localStorage.getItem("LOCATOR_USER_OPTIONS")!)).toEqual({
      uiState: { welcomeScreenDismissed: true },
    });
    expect(primaryModifiers(options.effective())).toBe("ctrl");
    expect(options.provenance().bindings).toBe("user-extension");
    expect(options.uiState()).toEqual({ welcomeScreenDismissed: true });
  });

  test("clearUserOrigin reports failure and preserves resolved state", async () => {
    const options = withRoot(() => initOptions());
    await options.setUserOrigin({ mouseModifiers: "shift" });
    const removeItem = vi
      .spyOn(Storage.prototype, "removeItem")
      .mockImplementation(() => {
        throw new DOMException("blocked", "SecurityError");
      });

    await expect(options.clearUserOrigin()).resolves.toEqual({
      ok: false,
      reason: "blocked",
    });
    expect(primaryModifiers(options.effective())).toBe("shift");

    removeItem.mockRestore();
  });

  test("team targets signal overrides default allTargets", async () => {
    const custom = { myEd: { url: "my-ed://${filePath}", label: "MyEd" } };
    setTeamTargets(custom);

    const options = withRoot(() => initOptions());

    expect(options.allTargets()).toEqual(custom);
    expect(options.allTargets()).not.toBe(allTargets);
  });
});

describe("mountRuntimePopupBridge", () => {
  beforeEach(() => {
    resetState();
  });

  test("exposes __LOCATOR_RUNTIME__ bridge with snapshot + applySiteLocal", async () => {
    updateTeamLayer({ bindings: editorBindings("vscode") });
    const options = withRoot(() => {
      const o = initOptions();
      mountRuntimePopupBridge(o);
      return o;
    });

    type WinWithRuntime = {
      __LOCATOR_RUNTIME__?: {
        getSnapshot: () => {
          effective: LocatorOptions;
          provenance: { bindings?: string };
        };
        applySiteLocal: (p: Record<string, unknown>) => Promise<unknown>;
      };
    };
    const runtime = (window as unknown as WinWithRuntime).__LOCATOR_RUNTIME__;
    expect(runtime).toBeDefined();

    const snap = runtime!.getSnapshot();
    expect(primaryEditorTarget(snap.effective)).toBe("vscode");
    expect(snap.provenance.bindings).toBe("team");

    await runtime!.applySiteLocal({ bindings: editorBindings("zed") });
    expect(primaryEditorTarget(options.effective())).toBe("zed");
    expect(options.provenance().bindings).toBe("user-origin");
  });

  test("responds to LOCATOR_PAGE_SNAPSHOT_REQUEST with matching requestId", async () => {
    const options = withRoot(() => {
      const o = initOptions();
      mountRuntimePopupBridge(o);
      return o;
    });
    await options.setUserOrigin({ mouseModifiers: "meta" });
    expect(primaryModifiers(options.effective())).toBe("meta");

    const response = await new Promise<Record<string, unknown>>((resolve) => {
      const handler = (event: MessageEvent) => {
        const data = event.data as Record<string, unknown> | undefined;
        if (
          data?.type === "LOCATOR_PAGE_SNAPSHOT_RESPONSE" &&
          data.requestId === "req-1"
        ) {
          window.removeEventListener("message", handler);
          resolve(data);
        }
      };
      window.addEventListener("message", handler);
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { type: "LOCATOR_PAGE_SNAPSHOT_REQUEST", requestId: "req-1" },
          source: window,
        })
      );
    });

    const snapshot = response.snapshot as { effective: LocatorOptions };
    expect(primaryModifiers(snapshot.effective)).toBe("meta");
  });

  test("responds to LOCATOR_PAGE_SITE_LOCAL_WRITE and applies patch", async () => {
    const options = withRoot(() => {
      const o = initOptions();
      mountRuntimePopupBridge(o);
      return o;
    });

    const result = await new Promise<Record<string, unknown>>((resolve) => {
      const handler = (event: MessageEvent) => {
        const data = event.data as Record<string, unknown> | undefined;
        if (
          data?.type === "LOCATOR_PAGE_SITE_LOCAL_WRITE_RESULT" &&
          data.requestId === "req-2"
        ) {
          window.removeEventListener("message", handler);
          resolve(data);
        }
      };
      window.addEventListener("message", handler);
      window.dispatchEvent(
        new MessageEvent("message", {
          data: {
            type: "LOCATOR_PAGE_SITE_LOCAL_WRITE",
            requestId: "req-2",
            patch: { mouseModifiers: "alt+ctrl" },
          },
          source: window,
        })
      );
    });

    expect(result.result).toEqual({ ok: true });
    expect(primaryModifiers(options.effective())).toBe("alt+ctrl");
  });

  test("responds to LOCATOR_PAGE_SITE_LOCAL_WRITE and applies explicit unsets", async () => {
    setUserExtensionGlobal({ mouseModifiers: "ctrl" });
    const options = withRoot(() => {
      const o = initOptions();
      mountRuntimePopupBridge(o);
      return o;
    });
    await options.setUserOrigin({ mouseModifiers: "shift" });
    expect(primaryModifiers(options.effective())).toBe("shift");

    const result = await new Promise<Record<string, unknown>>((resolve) => {
      const handler = (event: MessageEvent) => {
        const data = event.data as Record<string, unknown> | undefined;
        if (
          data?.type === "LOCATOR_PAGE_SITE_LOCAL_WRITE_RESULT" &&
          data.requestId === "req-3"
        ) {
          window.removeEventListener("message", handler);
          resolve(data);
        }
      };
      window.addEventListener("message", handler);
      window.dispatchEvent(
        new MessageEvent("message", {
          data: {
            type: "LOCATOR_PAGE_SITE_LOCAL_WRITE",
            requestId: "req-3",
            patch: {},
            unset: ["mouseModifiers"],
          },
          source: window,
        })
      );
    });

    expect(result.result).toEqual({ ok: true });
    expect(primaryModifiers(options.effective())).toBe("ctrl");
    expect(options.provenance().bindings).toBe("user-extension");
  });

  test("validates popup Try actions and dispatches only supported actions", async () => {
    const options = withRoot(() => {
      const o = initOptions();
      mountRuntimePopupBridge(o);
      return o;
    });
    const tried = vi.fn();
    window.addEventListener("locatorjs:try-action", tried);

    const response = await new Promise<Record<string, unknown>>((resolve) => {
      const handler = (event: MessageEvent) => {
        const data = event.data as Record<string, unknown> | undefined;
        if (
          data?.type === "LOCATOR_PAGE_TRY_ACTION_RESULT" &&
          data.requestId === "try-1"
        ) {
          window.removeEventListener("message", handler);
          resolve(data);
        }
      };
      window.addEventListener("message", handler);
      window.dispatchEvent(
        new MessageEvent("message", {
          data: {
            type: "LOCATOR_PAGE_TRY_ACTION",
            requestId: "try-1",
            action: { kind: "copy-path" },
          },
          source: window,
        })
      );
    });

    expect(response.result).toEqual({ ok: true });
    expect(tried).toHaveBeenCalledTimes(1);
    expect((tried.mock.calls[0]?.[0] as CustomEvent).detail).toEqual({
      kind: "copy-path",
    });
    window.removeEventListener("locatorjs:try-action", tried);
    void options;
  });
});
