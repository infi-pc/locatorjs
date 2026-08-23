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
    // Shaped like the shipped templates, which all join the root themselves.
    targets: {
      vscode: {
        label: "VS Code",
        url: "vscode://file/${projectPath}${filePath}:${line}:${column}",
      },
      cursor: {
        label: "Cursor",
        url: "cursor://file/${projectPath}${filePath}:${line}:${column}",
      },
    },
    options: {
      effective: () => ({
        editor: { targetId: "vscode" },
        bindings: [
          {
            trigger: { kind: "modifier-click" as const, modifiers: "alt" },
            action: { kind: "open-editor" as const },
          },
        ],
        projectPath: "/workspace",
        hrefTarget: "_self" as const,
      }),
    } as OptionsStore,
    showTree: vi.fn(),
    showParents: vi.fn(),
    requestEditorSetup: vi.fn(),
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

  test("an action without a destination follows the Editor setting", async () => {
    const ctx = context();
    ctx.options = {
      effective: () => ({
        editor: { targetId: "cursor" },
        projectPath: "/workspace",
        hrefTarget: "_self",
      }),
    } as OptionsStore;
    const open = vi.spyOn(window, "open").mockImplementation(() => null);

    expect(await performAction({ kind: "open-editor" }, ctx)).toBe(true);
    expect(open).toHaveBeenCalledWith(
      "cursor://file//workspace/src/Button.tsx:7:3",
      "_self"
    );
  });

  test("asks for an editor instead of opening a guessed destination", async () => {
    const ctx = context();
    ctx.options = {
      effective: () => ({ projectPath: "/workspace", hrefTarget: "_self" }),
    } as OptionsStore;
    const open = vi.spyOn(window, "open").mockImplementation(() => null);

    expect(await performAction({ kind: "open-editor" }, ctx)).toBe(false);
    expect(open).not.toHaveBeenCalled();
    expect(ctx.requestEditorSetup).toHaveBeenCalledWith(
      ctx.element.thisElement.link
    );
  });

  test("an editor pinned on the action overrides the Editor setting", async () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    await performAction(
      {
        kind: "open-editor",
        targetTemplate: "zed://file${projectPath}${filePath}",
      },
      context()
    );
    expect(open).toHaveBeenCalledWith(
      "zed://file/workspace/src/Button.tsx",
      "_self"
    );
  });

  test("copy-path and the editor link agree on a project-relative path", async () => {
    // babel-jsx emits `/src/Button.tsx`; the link template joins the root onto
    // it, so the clipboard has to carry the root too or the two disagree.
    writeText.mockResolvedValue(undefined);
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const ctx = context();
    ctx.element.thisElement.link!.filePath = "/src/Button.tsx";

    await performAction({ kind: "copy-path" }, ctx);
    await performAction({ kind: "open-editor" }, ctx);

    expect(writeText).toHaveBeenCalledWith("/workspace/src/Button.tsx:7:3");
    expect(open).toHaveBeenCalledWith(
      "vscode://file//workspace/src/Button.tsx:7:3",
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
