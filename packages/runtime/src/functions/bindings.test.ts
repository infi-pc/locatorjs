import { strictConfig } from "@locator/shared";
import { describe, expect, test } from "vitest";
import {
  FALLBACK_ACTIVATION_CHORD,
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

function configured(
  inputs: readonly strictConfig.BindingInput[]
): readonly strictConfig.ConfiguredBinding[] {
  const parsed = strictConfig.parseLayer({ bindings: inputs });
  if (!parsed.ok || !parsed.value.bindings) {
    throw new Error("Invalid binding fixture.");
  }
  return strictConfig.configuredBindings(parsed.value.bindings);
}

function defaultEffective(): strictConfig.EffectiveOptions {
  return strictConfig.effectiveOptions(
    strictConfig.resolveConfig(
      { default: strictConfig.DEFAULT_LAYER },
      strictConfig.BUILT_IN_TARGETS
    )
  );
}

describe("bindings", () => {
  test("matches exact chords", () => {
    const bindings = configured([
      {
        trigger: { kind: "modifier-click", modifiers: ["alt"] },
        action: { kind: "copy-path" },
      },
      {
        trigger: { kind: "modifier-click", modifiers: ["meta", "shift"] },
        action: { kind: "show-tree" },
      },
    ]);

    expect(matchBinding(bindings, event({ altKey: true }))).toBe(bindings[0]);
    expect(
      matchBinding(bindings, event({ altKey: true, shiftKey: true }))
    ).toBeNull();
  });

  test("ignores only a spurious macOS control modifier", () => {
    const ctrl = configured([
      {
        trigger: { kind: "modifier-click", modifiers: ["ctrl"] },
        action: { kind: "show-parents" },
      },
    ]);
    const alt = configured([
      {
        trigger: { kind: "modifier-click", modifiers: ["alt"] },
        action: { kind: "show-parents" },
      },
    ]);

    expect(matchBinding(ctrl, event({}), { ignoreCtrl: true })).toBeNull();
    expect(
      matchBinding(ctrl, event({ ctrlKey: true }), { ignoreCtrl: true })
    ).toBe(ctrl[0]);
    expect(
      matchBinding(alt, event({ altKey: true, ctrlKey: true }), {
        ignoreCtrl: true,
      })
    ).toBe(alt[0]);
    expect(
      matchBinding(alt, event({ altKey: true, ctrlKey: true }))
    ).toBeNull();
  });

  test("filters toolbar actions in configured order", () => {
    expect(
      iconBindings(effectiveBindings(defaultEffective())).map(
        (binding) => binding.action.kind
      )
    ).toEqual(["show-tree", "show-parents", "copy-path"]);
  });
});

describe("outline activation", () => {
  test("derives activation chords from shortcuts", () => {
    const bindings = configured([
      {
        trigger: { kind: "modifier-click", modifiers: ["alt"] },
        action: { kind: "open-editor" },
      },
      {
        trigger: { kind: "modifier-click", modifiers: ["meta", "shift"] },
        action: { kind: "copy-path" },
      },
      {
        trigger: { kind: "hover-toolbar" },
        action: { kind: "show-tree" },
      },
    ]);

    expect(
      activationModifiers(bindings).map(strictConfig.modifiersForChord)
    ).toEqual([["alt"], ["shift", "meta"]]);
    expect(matchesActivation(bindings, event({ altKey: true }))).toBe(true);
    expect(
      matchesActivation(bindings, event({ metaKey: true, shiftKey: true }))
    ).toBe(true);
    expect(matchesActivation(bindings, event({ ctrlKey: true }))).toBe(false);
  });

  test("toolbar-only and empty configurations retain a reveal gesture", () => {
    const toolbarOnly = configured([
      {
        trigger: { kind: "hover-toolbar" },
        action: { kind: "show-tree" },
      },
    ]);

    expect(activationModifiers(toolbarOnly)).toEqual([
      FALLBACK_ACTIVATION_CHORD,
    ]);
    expect(activationModifiers([])).toEqual([FALLBACK_ACTIVATION_CHORD]);
    expect(matchesActivation(toolbarOnly, event({ altKey: true }))).toBe(true);
    expect(matchBinding(toolbarOnly, event({ altKey: true }))).toBeNull();
    expect(
      matchesActivation(toolbarOnly, event({ altKey: true, shiftKey: true }))
    ).toBe(false);
  });
});
