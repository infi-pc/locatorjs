// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  disabled: false,
  initRender: vi.fn(),
  mountRuntimePopupBridge: vi.fn(() => () => undefined),
  installShadowRootTracking: vi.fn(),
}));

vi.mock("./functions/optionsStore", () => ({
  initOptions: () => ({
    effective: () => ({
      disabled: mocks.disabled,
      bindings: {
        shortcuts: {
          1: {
            kind: "open-editor",
            destination: { kind: "inherit" },
          },
        },
        toolbar: [],
      },
    }),
    subscribe: () => () => undefined,
    dispose: () => undefined,
  }),
}));
vi.mock("./functions/popupBridge", () => ({
  mountRuntimePopupBridge: mocks.mountRuntimePopupBridge,
}));
vi.mock("./functions/shadowRoots", () => ({
  installShadowRootTracking: mocks.installShadowRootTracking,
  getShadowRootOf: () => null,
}));
vi.mock("./functions/crossFrameModifiers", () => ({
  listenToFrameModifiers: () => () => undefined,
}));
vi.mock("./components/Runtime", () => ({ initRender: mocks.initRender }));

async function loadShell() {
  const { initRuntime, __resetRuntimeForTesting } = await import(
    "./initRuntime"
  );
  initRuntime();
  return __resetRuntimeForTesting;
}

async function flushImport() {
  for (let index = 0; index < 8; index += 1) await Promise.resolve();
}

describe("runtime activation shell", () => {
  let resetRuntime: (() => void) | undefined;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.disabled = false;
    document.head.innerHTML = "";
    document.body.innerHTML = '<button id="target">Target</button>';
  });

  afterEach(() => resetRuntime?.());

  test("keeps settings connected without loading the visual runtime", async () => {
    resetRuntime = await loadShell();

    expect(mocks.mountRuntimePopupBridge).toHaveBeenCalledOnce();
    expect(document.getElementById("locatorjs-wrapper")).toBeNull();
    expect(mocks.initRender).not.toHaveBeenCalled();
  });

  test("loads the UI on a configured activation gesture", async () => {
    resetRuntime = await loadShell();
    const target = document.getElementById("target")!;

    target.dispatchEvent(
      new MouseEvent("mouseover", {
        bubbles: true,
        composed: true,
        altKey: true,
      })
    );
    await flushImport();

    expect(document.getElementById("locatorjs-wrapper")).not.toBeNull();
    expect(mocks.initRender).toHaveBeenCalledWith(
      expect.any(HTMLDivElement),
      expect.any(Object),
      expect.objectContaining({
        activation: { held: true, target },
      })
    );
  });

  test("does not create or import the UI while disabled", async () => {
    mocks.disabled = true;
    resetRuntime = await loadShell();

    document.dispatchEvent(new KeyboardEvent("keydown", { altKey: true }));
    await flushImport();

    expect(document.getElementById("locatorjs-wrapper")).toBeNull();
    expect(mocks.initRender).not.toHaveBeenCalled();
  });

  test("carries a Try action across the lazy import", async () => {
    resetRuntime = await loadShell();
    const action = { kind: "copy-path" as const };

    window.dispatchEvent(
      new CustomEvent("locatorjs:try-action", { detail: action })
    );
    await flushImport();

    expect(mocks.initRender).toHaveBeenCalledWith(
      expect.any(HTMLDivElement),
      expect.any(Object),
      expect.objectContaining({ tryAction: action })
    );
  });
});
