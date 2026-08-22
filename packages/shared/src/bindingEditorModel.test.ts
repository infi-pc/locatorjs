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
  clearPrimaryEditorOverride,
  insertBinding,
  nextAvailableModifiers,
} from "./bindingEditorModel";

const bindings: Binding[] = [
  {
    trigger: { kind: "modifier-click", modifiers: "alt" },
    action: { kind: "open-editor", targetId: "vscode" },
  },
  { trigger: { kind: "hover-toolbar" }, action: { kind: "copy-path" } },
];

describe("binding editor model", () => {
  test("creates actions without an editor override", () => {
    // A bare open-editor action follows the global Editor setting; pinning a
    // target is something the user has to do deliberately.
    expect(defaultBindingAction("open-editor")).toEqual({
      kind: "open-editor",
    });
    expect(defaultBindingAction("show-tree")).toEqual({ kind: "show-tree" });
    expect(defaultBindingAction("open-prompt")).toEqual({
      kind: "open-prompt",
      app: "cursor",
    });
    expect(defaultBindingAction("nonsense")).toEqual({ kind: "open-editor" });
  });

  test("groups bindings while retaining their global positions", () => {
    expect(bindingsForTrigger(bindings, "modifier-click")).toEqual([
      bindings[0],
    ]);
    expect(bindingAt(bindings, "hover-toolbar", 0)).toBe(bindings[1]);
    expect(globalIndexForTrigger(bindings, "hover-toolbar", 0)).toBe(1);
  });

  test("inserts bindings in modifier then toolbar order", () => {
    const toolbar = createBindingDraft("hover-toolbar", bindings);
    const modifier = createBindingDraft("modifier-click", bindings);
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

  test("clears the override on the primary editor binding only", () => {
    expect(clearPrimaryEditorOverride(bindings)).toEqual([
      {
        trigger: { kind: "modifier-click", modifiers: "alt" },
        action: { kind: "open-editor" },
      },
      bindings[1],
    ]);
  });

  test("leaves bindings alone when there is nothing to clear", () => {
    // No editor binding at all…
    expect(
      clearPrimaryEditorOverride([
        { trigger: { kind: "hover-toolbar" }, action: { kind: "copy-path" } },
      ])
    ).toBeUndefined();
    // …and one that already follows the Editor setting.
    expect(
      clearPrimaryEditorOverride([
        {
          trigger: { kind: "modifier-click", modifiers: "alt" },
          action: { kind: "open-editor" },
        },
      ])
    ).toBeUndefined();
  });
});
