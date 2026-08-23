import { describe, expect, test } from "vitest";
import {
  FALLBACK_ACTIVATION_MODIFIERS,
  activationModifiers,
  effectiveBindings,
  iconBindings,
  matchBinding,
  matchesActivation,
} from "./bindings";

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
  describe("ignoreCtrl relaxes only a spurious ctrlKey", () => {
    const ctrlOnly = [
      {
        trigger: { kind: "modifier-click" as const, modifiers: "ctrl" },
        action: { kind: "show-parents" as const },
      },
    ];

    test("a plain right-click does not match a ctrl-only shortcut", () => {
      // Skipping the ctrl comparison outright made this match, so a Ctrl-only
      // shortcut swallowed the native context menu on every right-click.
      expect(
        matchBinding(ctrlOnly, event({}), { ignoreCtrl: true })
      ).toBeNull();
    });

    test("a ctrl-only shortcut still matches when ctrl is held", () => {
      expect(
        matchBinding(ctrlOnly, event({ ctrlKey: true }), { ignoreCtrl: true })
      ).toBe(ctrlOnly[0]);
    });

    test("macOS ctrl+click still reaches a non-ctrl shortcut", () => {
      // The reason ignoreCtrl exists: on macOS a Ctrl+click arrives as a
      // contextmenu event with ctrlKey set that the user never meant.
      const altOnly = [
        {
          trigger: { kind: "modifier-click" as const, modifiers: "alt" },
          action: { kind: "show-parents" as const },
        },
      ];
      expect(
        matchBinding(altOnly, event({ altKey: true, ctrlKey: true }), {
          ignoreCtrl: true,
        })
      ).toBe(altOnly[0]);
      expect(
        matchBinding(altOnly, event({ altKey: true, ctrlKey: true }))
      ).toBeNull();
    });
  });

  test("uses exact modifier matching and first-match wins", () => {
    const bindings = [
      {
        trigger: { kind: "modifier-click" as const, modifiers: "alt" },
        action: { kind: "copy-path" as const },
      },
      {
        trigger: { kind: "modifier-click" as const, modifiers: "alt" },
        action: { kind: "show-tree" as const },
      },
    ];
    expect(matchBinding(bindings, event({ altKey: true }))).toBe(bindings[0]);
    expect(
      matchBinding(bindings, event({ altKey: true, shiftKey: true }))
    ).toBeNull();
  });

  test("can ignore ctrl for macOS contextmenu matching", () => {
    const binding = {
      trigger: { kind: "modifier-click" as const, modifiers: "alt" },
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

describe("outline activation", () => {
  const toolbarOnly = [
    {
      trigger: { kind: "hover-toolbar" as const },
      action: { kind: "show-tree" as const },
    },
  ];

  test("derives the activation combinations from the shortcuts", () => {
    const bindings = [
      {
        trigger: { kind: "modifier-click" as const, modifiers: "alt" },
        action: { kind: "open-editor" as const },
      },
      {
        trigger: { kind: "modifier-click" as const, modifiers: "meta+shift" },
        action: { kind: "copy-path" as const },
      },
      ...toolbarOnly,
    ];
    expect(activationModifiers(bindings)).toEqual(["alt", "meta+shift"]);
    expect(matchesActivation(bindings, event({ altKey: true }))).toBe(true);
    expect(
      matchesActivation(bindings, event({ metaKey: true, shiftKey: true }))
    ).toBe(true);
    expect(matchesActivation(bindings, event({ ctrlKey: true }))).toBe(false);
    expect(matchesActivation(bindings, event({}))).toBe(false);
  });

  test("deduplicates combinations shared by several shortcuts", () => {
    const bindings = [
      {
        trigger: { kind: "modifier-click" as const, modifiers: "alt" },
        action: { kind: "open-editor" as const },
      },
      {
        trigger: { kind: "modifier-click" as const, modifiers: "alt" },
        action: { kind: "copy-path" as const },
      },
    ];
    expect(activationModifiers(bindings)).toEqual(["alt"]);
  });

  test("a toolbar-only config still has a way to reveal the toolbar", () => {
    // Deleting every shortcut used to leave the outline — and with it the tree
    // and parents actions — permanently unreachable.
    expect(activationModifiers(toolbarOnly)).toEqual([
      FALLBACK_ACTIVATION_MODIFIERS,
    ]);
    expect(matchesActivation(toolbarOnly, event({ altKey: true }))).toBe(true);
    expect(matchBinding(toolbarOnly, event({ altKey: true }))).toBeNull();
  });

  test("an empty config falls back too", () => {
    expect(activationModifiers([])).toEqual([FALLBACK_ACTIVATION_MODIFIERS]);
    expect(matchesActivation([], event({ altKey: true }))).toBe(true);
  });

  test("activation ignores extra modifiers, like binding matching does", () => {
    expect(
      matchesActivation(toolbarOnly, event({ altKey: true, shiftKey: true }))
    ).toBe(false);
  });
});
