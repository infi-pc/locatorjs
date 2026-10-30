import { strictConfig } from "@locator/shared";
import { describe, expect, test } from "vitest";
import {
  actionEditor,
  editorNeedsSetup,
  resolveEditorLink,
} from "./linkTemplateUrl";

function options(input: strictConfig.LocatorLayerInput = {}) {
  const layer = strictConfig.parseLayer(input);
  if (!layer.ok) throw new Error("Invalid editor fixture.");
  const resolved = strictConfig.resolveConfig(
    { default: strictConfig.DEFAULT_LAYER, team: layer.value },
    strictConfig.BUILT_IN_TARGETS
  );
  return {
    effective: () => strictConfig.effectiveOptions(resolved),
    targetRegistry: () => strictConfig.BUILT_IN_TARGETS,
  };
}

function openEditor(
  action: Extract<strictConfig.BindingAction, { kind: "open-editor" }>
): Extract<strictConfig.ConfiguredAction, { kind: "open-editor" }> {
  const parsed = strictConfig.parseAction(action);
  if (!parsed.ok || parsed.value.kind !== "open-editor") {
    throw new Error("Invalid editor action fixture.");
  }
  return parsed.value;
}

describe("editor resolution", () => {
  test("global link surfaces use the selected Editor setting", () => {
    const editor = resolveEditorLink(
      options({ editor: { kind: "target", id: "cursor" } })
    );
    expect(editor).toMatchObject({ kind: "selected", label: "Cursor" });
  });

  test("custom templates remain explicit selected destinations", () => {
    const editor = resolveEditorLink(
      options({
        editor: { kind: "template", template: "zed://${filePath}" },
      })
    );
    expect(editor).toMatchObject({
      kind: "selected",
      destination: { kind: "template", template: "zed://${filePath}" },
    });
  });

  test("an unknown persisted target produces a setup state", () => {
    const store = options({ editor: { kind: "target", id: "gone" } });
    expect(editorNeedsSetup(store)).toBe(true);
    expect(resolveEditorLink(store)).toMatchObject({
      kind: "needs-selection",
      reason: "unknown-target",
    });
  });

  test("an action without a destination follows the global setting", () => {
    const store = options({ editor: { kind: "target", id: "cursor" } });
    expect(
      actionEditor(openEditor({ kind: "open-editor" }), store)
    ).toMatchObject({ kind: "selected", label: "Cursor" });
  });

  test("an action destination overrides the global setting", () => {
    const store = options({ editor: { kind: "target", id: "cursor" } });
    expect(
      actionEditor(
        openEditor({
          kind: "open-editor",
          destination: { kind: "target", id: "vscode" },
        }),
        store
      )
    ).toMatchObject({ kind: "selected", label: "VSCode" });
  });
});
