// @vitest-environment jsdom
import { describe, expect, test, beforeEach } from "vitest";
import { createRoot } from "solid-js";
import { allTargets } from "@locator/shared";
import {
  updateTeamLayer,
  setTeamTargets,
  __resetTeamLayerForTesting,
} from "./teamLayerStore";
import { initOptions } from "./optionsStore";
import { mountRuntimePopupBridge } from "./popupBridge";

const disposers: (() => void)[] = [];

function withRoot<T>(fn: () => T): T {
  return createRoot((dispose) => {
    disposers.push(dispose);
    return fn();
  });
}

function resetState() {
  while (disposers.length) disposers.pop()!();
  localStorage.clear();
  delete (window as unknown as Record<string, unknown>)
    .__LOCATOR_USER_EXTENSION_OPTIONS__;
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

  test("reads initial user-extension layer from window global", async () => {
    (
      window as unknown as Record<string, unknown>
    ).__LOCATOR_USER_EXTENSION_OPTIONS__ = { mouseModifiers: "ctrl" };

    const options = withRoot(() => initOptions());

    expect(options.effective().mouseModifiers).toBe("ctrl");
    expect(options.provenance().mouseModifiers).toBe("user-extension");
  });

  test("postMessage updates user-extension layer after runtime mount", async () => {
    const options = withRoot(() => initOptions());

    expect(options.provenance().mouseModifiers).toBe("default");

    (
      window as unknown as Record<string, unknown>
    ).__LOCATOR_USER_EXTENSION_OPTIONS__ = { mouseModifiers: "shift" };
    window.dispatchEvent(
      new MessageEvent("message", {
        data: { type: "LOCATOR_USER_EXTENSION_OPTIONS_UPDATED" },
        source: window,
      })
    );

    expect(options.effective().mouseModifiers).toBe("shift");
    expect(options.provenance().mouseModifiers).toBe("user-extension");
  });

  test("user-project layer overrides user-extension and team layers", async () => {
    updateTeamLayer({ targetId: "vscode" });
    (
      window as unknown as Record<string, unknown>
    ).__LOCATOR_USER_EXTENSION_OPTIONS__ = { targetId: "cursor" };

    const options = withRoot(() => initOptions());
    await options.setUserProject({ targetId: "webstorm" });

    expect(options.effective().targetId).toBe("webstorm");
    expect(options.provenance().targetId).toBe("user-project");
  });

  test("window.enableLocator() writes to user-project layer only", async () => {
    const options = withRoot(() => initOptions());

    await options.setUserProject({ disabled: true });
    expect(options.effective().disabled).toBe(true);

    type WinWithEnable = { enableLocator?: () => string };
    const result = (window as unknown as WinWithEnable).enableLocator?.();

    expect(result).toBe("Locator enabled");
    expect(options.effective().disabled).toBe(false);
    expect(options.provenance().disabled).toBe("user-project");
  });

  test("atomic replacePath merge across layers (later layer fully replaces)", async () => {
    updateTeamLayer({
      replacePath: { from: "/team/from", to: "/team/to" },
    });

    const options = withRoot(() => initOptions());
    await options.setUserProject({
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
    updateTeamLayer({ targetId: "vscode" });
    const options = withRoot(() => {
      const o = initOptions();
      mountRuntimePopupBridge(o);
      return o;
    });

    type WinWithRuntime = {
      __LOCATOR_RUNTIME__?: {
        getSnapshot: () => {
          effective: { targetId?: string };
          provenance: { targetId?: string };
        };
        applySiteLocal: (p: Record<string, unknown>) => Promise<unknown>;
      };
    };
    const runtime = (window as unknown as WinWithRuntime).__LOCATOR_RUNTIME__;
    expect(runtime).toBeDefined();

    const snap = runtime!.getSnapshot();
    expect(snap.effective.targetId).toBe("vscode");
    expect(snap.provenance.targetId).toBe("team");

    await runtime!.applySiteLocal({ targetId: "zed" });
    expect(options.effective().targetId).toBe("zed");
    expect(options.provenance().targetId).toBe("user-project");
  });

  test("responds to LOCATOR_PAGE_SNAPSHOT_REQUEST with matching requestId", async () => {
    const options = withRoot(() => {
      const o = initOptions();
      mountRuntimePopupBridge(o);
      return o;
    });
    await options.setUserProject({ mouseModifiers: "meta" });
    expect(options.effective().mouseModifiers).toBe("meta");

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

    const snapshot = response.snapshot as {
      effective: { mouseModifiers?: string };
    };
    expect(snapshot.effective.mouseModifiers).toBe("meta");
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
    expect(options.effective().mouseModifiers).toBe("alt+ctrl");
  });
});
