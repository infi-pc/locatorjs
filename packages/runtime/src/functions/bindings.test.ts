import { describe, expect, test } from "vitest";
import { effectiveBindings, iconBindings, matchBinding } from "./bindings";

const event = (
  keys: Partial<
    Pick<KeyboardEvent, "altKey" | "ctrlKey" | "metaKey" | "shiftKey">
  >
) => ({
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  ...keys,
});

describe("bindings", () => {
  test("uses exact modifier matching and first-match wins", () => {
    const bindings = [
      { modifiers: "alt", action: { kind: "copy-path" as const } },
      { modifiers: "alt", action: { kind: "show-tree" as const } },
    ];
    expect(matchBinding(bindings, event({ altKey: true }))).toBe(bindings[0]);
    expect(
      matchBinding(bindings, event({ altKey: true, shiftKey: true }))
    ).toBeNull();
  });

  test("can ignore ctrl for macOS contextmenu matching", () => {
    const binding = {
      modifiers: "alt",
      action: { kind: "open-editor" as const },
    };
    expect(
      matchBinding([binding], event({ altKey: true, ctrlKey: true }), {
        ignoreCtrl: true,
      })
    ).toBe(binding);
  });

  test("filters hover icons in document order", () => {
    const bindings = effectiveBindings({});
    expect(iconBindings(bindings).map((item) => item.action.kind)).toEqual([
      "show-tree",
      "show-parents",
      "copy-path",
    ]);
  });
});
