import { describe, expect, test } from "vitest";
import type { Binding } from "./layeredOptions";
import {
  MAX_BINDINGS_PER_TRIGGER,
  bindingAt,
  bindingsForTrigger,
  canAddBinding,
  createBindingDraft,
  defaultBindingAction,
  duplicateShortcutModifiers,
  globalIndexForTrigger,
  hasShortcutConflict,
  insertBinding,
  nextAvailableModifiers,
  replacePrimaryEditorBinding,
} from "./bindingEditorModel";

const targets = {
  cursor: { label: "Cursor", url: "cursor://file/${filePath}" },
  vscode: { label: "VS Code", url: "vscode://file/${filePath}" },
};

const bindings: Binding[] = [
  {
    trigger: { kind: "modifier-click", modifiers: "alt" },
    action: { kind: "open-editor", targetId: "vscode" },
  },
  { trigger: { kind: "hover-toolbar" }, action: { kind: "copy-path" } },
];

describe("binding editor model", () => {
  test("uses VS Code, the first target, or target resolution fallback", () => {
    expect(defaultBindingAction("open-editor", targets)).toEqual({
      kind: "open-editor",
      targetId: "vscode",
    });
    expect(
      defaultBindingAction("open-editor", {
        cursor: targets.cursor,
        webstorm: {
          label: "WebStorm",
          url: "webstorm://open?file=${filePath}",
        },
      })
    ).toEqual({ kind: "open-editor", targetId: "cursor" });
    expect(defaultBindingAction("open-editor", {})).toEqual({
      kind: "open-editor",
    });
  });

  test("groups bindings while retaining their global positions", () => {
    expect(bindingsForTrigger(bindings, "modifier-click")).toEqual([
      bindings[0],
    ]);
    expect(bindingAt(bindings, "hover-toolbar", 0)).toBe(bindings[1]);
    expect(globalIndexForTrigger(bindings, "hover-toolbar", 0)).toBe(1);
  });

  test("inserts bindings in modifier then toolbar order", () => {
    const toolbar = createBindingDraft("hover-toolbar", bindings, targets);
    const modifier = createBindingDraft("modifier-click", bindings, targets);
    expect(modifier.trigger).toEqual({
      kind: "modifier-click",
      modifiers: "alt+shift",
    });
    expect(insertBinding(bindings, toolbar)?.at(-1)).toBe(toolbar);
    expect(
      insertBinding(bindings, modifier)?.map((item) => item.trigger.kind)
    ).toEqual(["modifier-click", "modifier-click", "hover-toolbar"]);
  });

  test("enforces the per-trigger limit independently", () => {
    const full: Binding[] = Array.from(
      { length: MAX_BINDINGS_PER_TRIGGER },
      () => ({
        trigger: { kind: "hover-toolbar" },
        action: { kind: "copy-path" },
      })
    );
    expect(canAddBinding(full, "hover-toolbar")).toBe(false);
    expect(canAddBinding(full, "modifier-click")).toBe(true);
    expect(
      insertBinding(full, {
        trigger: { kind: "hover-toolbar" },
        action: { kind: "show-tree" },
      })
    ).toBeUndefined();
  });

  test("selects the next shortcut and reports conflicts", () => {
    const duplicate: Binding = {
      trigger: { kind: "modifier-click", modifiers: "alt" },
      action: { kind: "open-editor", targetId: "vscode" },
    };
    expect(nextAvailableModifiers(bindings)).toBe("alt+shift");
    expect(hasShortcutConflict(duplicate, bindings)).toBe(true);
    expect(duplicateShortcutModifiers([...bindings, duplicate])).toEqual(
      new Set(["alt"])
    );
  });

  test("replaces only the primary editor binding", () => {
    expect(
      replacePrimaryEditorBinding(bindings, { targetId: "cursor" })
    ).toEqual([
      {
        trigger: { kind: "modifier-click", modifiers: "alt" },
        action: { kind: "open-editor", targetId: "cursor" },
      },
      bindings[1],
    ]);
    expect(
      replacePrimaryEditorBinding(
        [{ trigger: { kind: "hover-toolbar" }, action: { kind: "copy-path" } }],
        { targetId: "cursor" }
      )
    ).toBeUndefined();
  });
});
