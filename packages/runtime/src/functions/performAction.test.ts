// @vitest-environment jsdom
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { FullElementInfo } from "../adapters/adapterApi";
import type { OptionsStore } from "./optionsStore";
import { performAction } from "./performAction";

const writeText = vi.fn();

function element(): FullElementInfo {
  const htmlElement = document.createElement("button");
  return {
    htmlElement,
    thisElement: {
      box: { x: 10, y: 20, width: 30, height: 10 },
      label: "Button",
      link: {
        filePath: "[project]/src/Button.tsx",
        projectPath: "/repo",
        line: 7,
        column: 3,
      },
    },
    parentElements: [],
    componentBox: { x: 10, y: 20, width: 30, height: 10 },
    componentsLabels: [],
  };
}

function context() {
  return {
    element: element(),
    targets: {
      vscode: {
        label: "VS Code",
        url: "vscode://file/${filePath}:${line}:${column}",
      },
      cursor: {
        label: "Cursor",
        url: "cursor://file/${filePath}:${line}:${column}",
      },
    },
    options: {
      effective: () => ({
        targetId: "vscode",
        projectPath: "/workspace",
        hrefTarget: "_self" as const,
      }),
    } as OptionsStore,
    showTree: vi.fn(),
    showParents: vi.fn(),
  };
}

describe("performAction", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    writeText.mockReset();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
  });

  test("copies a resolved path with line and column", async () => {
    writeText.mockResolvedValue(undefined);
    expect(await performAction({ kind: "copy-path" }, context())).toBe(true);
    expect(writeText).toHaveBeenCalledWith("/workspace/src/Button.tsx:7:3");
  });

  test("opens a per-binding editor target", async () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    await performAction({ kind: "open-editor", targetId: "cursor" }, context());
    expect(open).toHaveBeenCalledWith(
      "cursor://file//workspace/src/Button.tsx:7:3",
      "_self"
    );
  });

  test("routes tree and parents actions through UI callbacks", async () => {
    const ctx = context();
    await performAction({ kind: "show-tree" }, ctx);
    await performAction({ kind: "show-parents" }, ctx);
    expect(ctx.showTree).toHaveBeenCalledWith(ctx.element.htmlElement);
    expect(ctx.showParents).toHaveBeenCalledWith(
      ctx.element.htmlElement,
      12,
      40
    );
  });
});
