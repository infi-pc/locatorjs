import { afterEach, describe, expect, test, vi } from "vitest";
import { setup } from "./index";
import {
  __resetTeamLayerForTesting,
  getTeamLayerSignal,
  getTeamTargetsSignal,
} from "./functions/teamLayerStore";

vi.mock("./initRuntime", () => ({ initRuntime: vi.fn() }));

afterEach(() => {
  __resetTeamLayerForTesting();
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe("setup", () => {
  test("forwards canonical options and preserves legacy aliases", () => {
    vi.useFakeTimers();

    setup({
      adapter: "react",
      bindings: [
        {
          trigger: { kind: "modifier-click", modifiers: "ctrl" },
          action: { kind: "open-editor", targetId: "vscode" },
        },
      ],
      mouseModifiers: "ctrl",
      debugMode: true,
      targets: { custom: "custom://file/${filePath}" },
    });

    expect(getTeamLayerSignal()()).toMatchObject({
      adapterId: "react",
      bindings: [
        {
          trigger: { kind: "modifier-click", modifiers: "ctrl" },
          action: { kind: "open-editor", targetId: "vscode" },
        },
      ],
      mouseModifiers: "ctrl",
      debugMode: true,
    });
    expect(getTeamTargetsSignal()()).toEqual({
      custom: { url: "custom://file/${filePath}", label: "custom" },
    });
  });
});
