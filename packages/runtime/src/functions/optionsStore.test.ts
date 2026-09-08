// @vitest-environment jsdom
import { strictConfig, strictConfigStorage } from "@locator/shared";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { initOptions, type OptionsStore } from "./optionsStore";
import { mountRuntimePopupBridge } from "./popupBridge";
import {
  __resetTeamLayerForTesting,
  replaceTeamConfig,
} from "./teamLayerStore";

const stores: OptionsStore[] = [];

function withStore(fn: () => OptionsStore): OptionsStore {
  const store = fn();
  stores.push(store);
  return store;
}

function configureTeam(input: strictConfig.LocatorConfigInput) {
  const compiled = strictConfig.compileSetup(input);
  if (!compiled.ok) throw new Error("Invalid team fixture.");
  replaceTeamConfig(compiled.value);
}

function setUserExtensionGlobal(input: strictConfig.LocatorLayerInput) {
  document.documentElement.dataset.locatorUserExtensionOptions =
    JSON.stringify(input);
}

function modifiers(options: ReturnType<typeof initOptions>) {
  const shortcut = strictConfig.primaryEditorShortcut(
    options.effective().bindings
  );
  return shortcut
    ? strictConfig.modifiersForChord(shortcut.trigger.chord)
    : undefined;
}

function editorActionDestination(options: ReturnType<typeof initOptions>) {
  const action = strictConfig.primaryEditorBinding(
    options.effective().bindings
  )?.action;
  if (action?.kind !== "open-editor") return undefined;
  const encoded = strictConfig.encodeAction(action);
  return encoded.kind === "open-editor" ? encoded.destination : undefined;
}

function resetState() {
  while (stores.length) stores.pop()!.dispose();
  localStorage.clear();
  delete document.documentElement.dataset.locatorUserExtensionOptions;
  delete document.documentElement.dataset.locatorEditorWithheld;
  delete window.__LOCATOR_RUNTIME__;
  delete (window as unknown as { enableLocator?: unknown }).enableLocator;
  __resetTeamLayerForTesting();
}

beforeEach(resetState);
afterEach(() => vi.restoreAllMocks());

describe("optionsStore integration", () => {
  test("legacy opt-out and UI choices stay effective when migration cannot write", async () => {
    localStorage.setItem(
      strictConfigStorage.LEGACY_SITE_STORAGE_KEY,
      JSON.stringify({
        disabled: true,
        templateOrTemplateId: "webstorm",
        welcomeScreenDismissed: true,
      })
    );
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Full", "QuotaExceededError");
    });
    const options = withStore(() => initOptions());

    expect(options.effective().disabled).toBe(true);
    expect(options.provenance().disabled).toBe("user-origin");
    expect(options.effective().editor).toMatchObject({
      kind: "selected",
      destination: { kind: "target", id: "webstorm" },
    });
    expect(options.uiState()).toEqual({ welcomeScreenDismissed: true });
    await expect(
      options.setUserOrigin({ set: { disabled: false } })
    ).resolves.toEqual({ ok: false, reason: "quota" });
    expect(options.effective().disabled).toBe(true);
  });

  test("a late setup snapshot atomically re-drives resolution", () => {
    const options = withStore(() => initOptions());
    expect(options.effective().projectPath).toBeNull();

    configureTeam({ projectPath: "/repo/late", debugMode: true });

    expect(options.effective().projectPath).toBe("/repo/late");
    expect(options.effective().debugMode).toBe(true);
    expect(options.provenance().projectPath).toBe("team");
  });

  test("parses the extension dataset once and reacts to valid replacements", async () => {
    setUserExtensionGlobal({
      bindings: [
        {
          trigger: { kind: "modifier-click", modifiers: ["ctrl"] },
          action: { kind: "open-editor" },
        },
      ],
    });
    const options = withStore(() => initOptions());
    expect(modifiers(options)).toEqual(["ctrl"]);
    expect(options.provenance().bindings).toBe("user-extension");

    setUserExtensionGlobal({
      bindings: [
        {
          trigger: { kind: "modifier-click", modifiers: ["shift"] },
          action: { kind: "open-editor" },
        },
      ],
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(modifiers(options)).toEqual(["shift"]);
  });

  test("rejects malformed extension data instead of partially applying it", () => {
    document.documentElement.dataset.locatorUserExtensionOptions =
      JSON.stringify({ projectPath: "/accepted", surprise: true });
    const options = withStore(() => initOptions());

    expect(options.effective().projectPath).toBeNull();
    expect(options.provenance().projectPath).toBe("default");
  });

  test("reports when editor configuration is withheld from this frame", async () => {
    document.documentElement.dataset.locatorEditorWithheld = "true";
    const options = withStore(() => initOptions());
    expect(options.editorWithheld()).toBe(true);

    document.documentElement.dataset.locatorEditorWithheld = "false";
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(options.editorWithheld()).toBe(false);
  });

  test("explicit site patches override extension and team bindings", async () => {
    configureTeam({
      bindings: [
        {
          trigger: { kind: "modifier-click", modifiers: ["alt"] },
          action: {
            kind: "open-editor",
            destination: { kind: "target", id: "vscode" },
          },
        },
      ],
    });
    setUserExtensionGlobal({
      bindings: [
        {
          trigger: { kind: "modifier-click", modifiers: ["ctrl"] },
          action: {
            kind: "open-editor",
            destination: { kind: "target", id: "cursor" },
          },
        },
      ],
    });
    const options = withStore(() => initOptions());

    await options.setUserOrigin({
      set: {
        bindings: [
          {
            trigger: { kind: "modifier-click", modifiers: ["shift"] },
            action: {
              kind: "open-editor",
              destination: { kind: "target", id: "webstorm" },
            },
          },
        ],
      },
    });

    expect(modifiers(options)).toEqual(["shift"]);
    expect(editorActionDestination(options)).toEqual({
      kind: "target",
      id: "webstorm",
    });
    expect(options.provenance().bindings).toBe("user-origin");
  });

  test("window.enableLocator writes only the disabled field", async () => {
    const options = withStore(() => initOptions());
    await options.setUserOrigin({
      set: { disabled: true, projectPath: "/repo" },
    });

    await expect(window.enableLocator?.()).resolves.toEqual({ ok: true });
    expect(options.effective().disabled).toBe(false);
    expect(options.effective().projectPath).toBe("/repo");
    expect(options.provenance().disabled).toBe("user-origin");
  });

  test("path rewrites are atomic values across layers", async () => {
    configureTeam({ replacePath: { from: "/team", to: "/workspace" } });
    const options = withStore(() => initOptions());

    await options.setUserOrigin({
      set: { replacePath: { from: "/user", to: "/volume" } },
    });

    const rewrite = options.effective().replacePath;
    expect(rewrite).not.toBeNull();
    expect(strictConfig.rewritePath(rewrite!, "/user/app.ts")).toBe(
      "/volume/app.ts"
    );
  });

  test("UI state is persisted separately and survives clearing config", async () => {
    const options = withStore(() => initOptions());
    await options.setUserOrigin({ set: { projectPath: "/repo" } });
    await options.setUiState({ welcomeScreenDismissed: true });

    await expect(options.clearUserOrigin()).resolves.toEqual({ ok: true });

    expect(options.effective().projectPath).toBeNull();
    expect(options.uiState()).toEqual({ welcomeScreenDismissed: true });
    expect(
      localStorage.getItem(strictConfigStorage.USER_CONFIG_STORAGE_KEY)
    ).toBeNull();
    expect(
      JSON.parse(
        localStorage.getItem(strictConfigStorage.UI_STATE_STORAGE_KEY)!
      )
    ).toEqual({
      version: 1,
      state: { welcomeScreenDismissed: true },
    });
  });

  test("team targets and layer change as one snapshot", () => {
    configureTeam({
      targets: { myEditor: "my-editor://${filePath}" },
      projectPath: "/repo",
    });
    const options = withStore(() => initOptions());

    expect(options.allTargets()).toEqual({
      myEditor: { label: "myEditor", url: "my-editor://${filePath}" },
    });
    expect(options.effective().projectPath).toBe("/repo");
    expect(options.effective().editor).toMatchObject({
      kind: "selected",
      destination: { kind: "target", id: "myEditor" },
    });
  });
});

describe("mountRuntimePopupBridge", () => {
  test("exposes a strict snapshot and applies an explicit site patch", async () => {
    configureTeam({ projectPath: "/team" });
    const options = withStore(() => {
      const store = initOptions();
      mountRuntimePopupBridge(store);
      return store;
    });
    const runtime = window.__LOCATOR_RUNTIME__;
    expect(runtime).toBeDefined();
    expect(runtime!.getSnapshot().effective.projectPath).toBe("/team");

    await runtime!.applySiteLocal({ set: { projectPath: "/site" } });
    expect(options.effective().projectPath).toBe("/site");
    expect(options.provenance().projectPath).toBe("user-origin");
  });

  test("validates Try actions before dispatching them", async () => {
    withStore(() => {
      const store = initOptions();
      mountRuntimePopupBridge(store);
      return store;
    });
    const tried = vi.fn();
    window.addEventListener("locatorjs:try-action", tried);

    window.dispatchEvent(
      new MessageEvent("message", {
        data: {
          type: "LOCATOR_PAGE_TRY_ACTION",
          requestId: "valid",
          expectedOrigin: window.location.origin,
          action: { kind: "copy-path" },
        },
        source: window,
      })
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(tried).toHaveBeenCalledTimes(1);

    window.dispatchEvent(
      new MessageEvent("message", {
        data: {
          type: "LOCATOR_PAGE_TRY_ACTION",
          requestId: "unsafe",
          expectedOrigin: window.location.origin,
          action: {
            kind: "open-editor",
            destination: {
              kind: "template",
              template: "javascript:alert(1)",
            },
          },
        },
        source: window,
      })
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(tried).toHaveBeenCalledTimes(1);
    window.removeEventListener("locatorjs:try-action", tried);
  });
});
