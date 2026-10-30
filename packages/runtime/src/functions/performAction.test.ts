// @vitest-environment jsdom
import { strictConfig } from "@locator/shared";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { FullElementInfo } from "../adapters/adapterApi";
import { performAction, type ActionContext } from "./performAction";

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

function options(input: strictConfig.LocatorConfigInput = {}) {
  const compiled = strictConfig.compileSetup(input);
  if (!compiled.ok) throw new Error("Invalid action fixture.");
  const effective = strictConfig.effectiveOptions(
    strictConfig.resolveConfig(
      { default: strictConfig.DEFAULT_LAYER, team: compiled.value.layer },
      compiled.value.targets
    )
  );
  return {
    effective: () => effective,
    targetRegistry: () => compiled.value.targets,
  };
}

function action(
  input: strictConfig.BindingAction
): strictConfig.ConfiguredAction {
  const parsed = strictConfig.parseAction(input);
  if (!parsed.ok) throw new Error("Invalid action fixture.");
  return parsed.value;
}

function context(): ActionContext {
  return {
    element: element(),
    options: options({
      projectPath: "/workspace",
      editor: { kind: "target", id: "vscode" },
    }),
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
    expect(await performAction(action({ kind: "copy-path" }), context())).toBe(
      true
    );
    expect(writeText).toHaveBeenCalledWith("/workspace/src/Button.tsx:7:3");
  });

  test("opens an editor pinned on the action", async () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    await performAction(
      action({
        kind: "open-editor",
        destination: { kind: "target", id: "cursor" },
      }),
      context()
    );
    expect(open).toHaveBeenCalledWith(
      "cursor://file//workspace/src/Button.tsx:7:3",
      "_self"
    );
  });

  test("an inherited action follows the global Editor setting", async () => {
    const ctx = context();
    ctx.options = options({
      projectPath: "/workspace",
      editor: { kind: "target", id: "cursor" },
    });
    const open = vi.spyOn(window, "open").mockImplementation(() => null);

    expect(await performAction(action({ kind: "open-editor" }), ctx)).toBe(
      true
    );
    expect(open).toHaveBeenCalledWith(
      "cursor://file//workspace/src/Button.tsx:7:3",
      "_self"
    );
  });

  test("requests an editor instead of opening a guessed destination", async () => {
    const ctx = context();
    const custom = strictConfig.compileSetup({
      targets: { github: "https://github.test${filePath}" },
    });
    if (!custom.ok) throw new Error("Invalid target fixture.");
    const effective = strictConfig.effectiveOptions(
      strictConfig.resolveConfig(
        { default: strictConfig.DEFAULT_LAYER },
        custom.value.targets
      )
    );
    ctx.options = {
      effective: () => effective,
      targetRegistry: () => custom.value.targets,
    };
    const open = vi.spyOn(window, "open").mockImplementation(() => null);

    expect(await performAction(action({ kind: "open-editor" }), ctx)).toBe(
      false
    );
    expect(open).not.toHaveBeenCalled();
    expect(ctx.requestEditorSetup).toHaveBeenCalledWith(
      ctx.element.thisElement.link
    );
  });

  test("opens a custom template pinned on the action", async () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    await performAction(
      action({
        kind: "open-editor",
        destination: {
          kind: "template",
          template: "zed://file${projectPath}${filePath}",
        },
      }),
      context()
    );
    expect(open).toHaveBeenCalledWith(
      "zed://file/workspace/src/Button.tsx",
      "_self"
    );
  });

  test("copy-path and editor navigation resolve the same relative path", async () => {
    writeText.mockResolvedValue(undefined);
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const ctx = context();
    ctx.element.thisElement.link!.filePath = "/src/Button.tsx";

    await performAction(action({ kind: "copy-path" }), ctx);
    await performAction(action({ kind: "open-editor" }), ctx);

    expect(writeText).toHaveBeenCalledWith("/workspace/src/Button.tsx:7:3");
    expect(open).toHaveBeenCalledWith(
      "vscode://file//workspace/src/Button.tsx:7:3",
      "_self"
    );
  });

  test("routes tree and parents actions through UI callbacks", async () => {
    const ctx = context();
    await performAction(action({ kind: "show-tree" }), ctx);
    await performAction(action({ kind: "show-parents" }), ctx);
    expect(ctx.showTree).toHaveBeenCalledWith(ctx.element.htmlElement);
    expect(ctx.showParents).toHaveBeenCalledWith(
      ctx.element.htmlElement,
      12,
      40
    );
  });
});
