import fc from "fast-check";
import { describe, expect, test } from "vitest";
import {
  BUILT_IN_TARGETS,
  DEFAULT_LAYER,
  applyLayerPatch,
  compileSetup,
  configProvenance,
  decodeEnvelope,
  effectiveOptions,
  encodeEnvelope,
  encodeLayer,
  modifierChordFromState,
  modifiersForChord,
  parseLayer,
  parseLayerPatch,
  resolveConfig,
  shortcutAction,
  type BindingInput,
  type Modifier,
} from "./config";

const toolbarBindings: BindingInput[] = [
  { trigger: { kind: "hover-toolbar" }, action: { kind: "show-tree" } },
  {
    trigger: { kind: "hover-toolbar" },
    action: { kind: "show-parents" },
  },
];

describe("configuration compiler", () => {
  test("compiles the released v1 setup fields and selects a custom target", () => {
    const compiled = compileSetup({
      adapter: "jsx",
      projectPath: "/repo/",
      showIntro: false,
      targets: {
        github: "https://github.com/acme/repo/blob/main${filePath}#L${line}",
      },
    });

    expect(compiled.ok).toBe(true);
    if (!compiled.ok) return;
    expect(encodeLayer(compiled.value.layer)).toMatchObject({
      adapter: "jsx",
      projectPath: "/repo",
      showIntro: false,
      editor: { kind: "target", id: "github" },
    });
  });

  test("rejects the complete setup transaction and reports stable paths", () => {
    const compiled = compileSetup({
      adapter: "angular",
      editor: { kind: "target", id: "missing" },
      surprise: true,
    });

    expect(compiled).toEqual({
      ok: false,
      errors: expect.arrayContaining([
        expect.objectContaining({ path: "/adapter", code: "invalid-enum" }),
        expect.objectContaining({ path: "/editor/id", code: "unknown-target" }),
        expect.objectContaining({ path: "/surprise", code: "unknown-key" }),
      ]),
    });
  });

  test("rejects empty, unknown, repeated, and semantically duplicate shortcuts", () => {
    const parsed = parseLayer({
      bindings: [
        {
          trigger: { kind: "modifier-click", modifiers: [] },
          action: { kind: "open-editor" },
        },
        {
          trigger: {
            kind: "modifier-click",
            modifiers: ["alt", "capslock"],
          },
          action: { kind: "copy-path" },
        },
        {
          trigger: {
            kind: "modifier-click",
            modifiers: ["shift", "alt"],
          },
          action: { kind: "copy-path" },
        },
        {
          trigger: {
            kind: "modifier-click",
            modifiers: ["alt", "shift"],
          },
          action: { kind: "show-tree" },
        },
        {
          trigger: {
            kind: "modifier-click",
            modifiers: ["meta", "meta"],
          },
          action: { kind: "show-parents" },
        },
      ],
    });

    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining([
        "empty-chord",
        "invalid-enum",
        "duplicate-shortcut",
        "duplicate-modifier",
      ])
    );
  });

  test("cannot install a zero-modifier action", () => {
    const parsed = parseLayer({
      bindings: [
        {
          trigger: { kind: "modifier-click", modifiers: ["alt"] },
          action: { kind: "copy-path" },
        },
      ],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const bindings = parsed.value.bindings;
    expect(bindings).toBeDefined();
    if (!bindings) return;
    expect(
      shortcutAction(
        bindings,
        modifierChordFromState({
          alt: false,
          ctrl: false,
          shift: false,
          meta: false,
        })
      )
    ).toBeUndefined();
  });

  test.each([
    "javascript:alert(1)",
    "DATA:text/html,hello",
    "blob:https://example.com/id",
    "missing-scheme",
  ])("rejects unsafe or ambiguous URL template %s", (template) => {
    const parsed = parseLayer({
      editor: { kind: "template", template },
    });
    expect(parsed.ok).toBe(false);
  });

  test("rejects invalid path rewrite expressions before they can execute", () => {
    const parsed = parseLayer({ replacePath: { from: "[", to: "/src" } });
    expect(parsed).toEqual({
      ok: false,
      errors: [
        expect.objectContaining({
          path: "/replacePath/from",
          code: "invalid-regexp",
        }),
      ],
    });
  });

  test("does not retain mutable input references", () => {
    const input: { bindings: BindingInput[] } = {
      bindings: [
        {
          trigger: { kind: "modifier-click", modifiers: ["alt"] },
          action: { kind: "copy-path" },
        },
      ],
    };
    const parsed = parseLayer(input);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    input.bindings.splice(0, 1);
    expect(encodeLayer(parsed.value).bindings).toHaveLength(1);
    expect(Object.isFrozen(parsed.value)).toBe(true);
    expect(Object.isFrozen(parsed.value.bindings?.toolbar)).toBe(true);
  });
});

describe("configuration resolution and patches", () => {
  test("pairs every effective value with its winning layer", () => {
    const team = parseLayer({ projectPath: "/team", disabled: true });
    const extension = parseLayer({ projectPath: "/extension" });
    const origin = parseLayer({ disabled: false });
    expect(team.ok && extension.ok && origin.ok).toBe(true);
    if (!team.ok || !extension.ok || !origin.ok) return;

    const resolved = resolveConfig(
      {
        default: DEFAULT_LAYER,
        team: team.value,
        "user-extension": extension.value,
        "user-origin": origin.value,
      },
      BUILT_IN_TARGETS
    );

    expect(effectiveOptions(resolved)).toMatchObject({
      projectPath: "/extension",
      disabled: false,
    });
    expect(configProvenance(resolved)).toMatchObject({
      projectPath: "user-extension",
      disabled: "user-origin",
    });
  });

  test("represents default and missing editor choices instead of guessing", () => {
    const defaults = resolveConfig(
      { default: DEFAULT_LAYER },
      BUILT_IN_TARGETS
    );
    expect(defaults.fields.editor.value).toMatchObject({
      kind: "needs-selection",
      reason: "default-only",
    });

    const unknown = parseLayer({
      editor: { kind: "target", id: "removed-editor" },
    });
    expect(unknown.ok).toBe(true);
    if (!unknown.ok) return;
    expect(
      resolveConfig(
        { default: DEFAULT_LAYER, "user-origin": unknown.value },
        BUILT_IN_TARGETS
      ).fields.editor.value
    ).toMatchObject({ kind: "needs-selection", reason: "unknown-target" });
  });

  test("uses explicit set/unset semantics", () => {
    const current = parseLayer({ projectPath: "/repo", disabled: true });
    const patch = parseLayerPatch({
      set: { disabled: false },
      unset: ["projectPath"],
    });
    expect(current.ok && patch.ok).toBe(true);
    if (!current.ok || !patch.ok) return;

    expect(
      encodeLayer(applyLayerPatch(current.value, patch.value).layer)
    ).toEqual({
      disabled: false,
    });
  });

  test("rejects a field that is both set and unset", () => {
    const parsed = parseLayerPatch({
      set: { projectPath: "/repo" },
      unset: ["projectPath"],
    });
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.errors).toContainEqual(
      expect.objectContaining({ code: "conflicting-patch" })
    );
  });

  test("reports patch validation errors at the patch boundary", () => {
    const parsed = parseLayerPatch({
      set: { replacePath: { from: "[", to: "/src" } },
    });

    expect(parsed).toEqual({
      ok: false,
      errors: [
        expect.objectContaining({
          path: "/set/replacePath/from",
          code: "invalid-regexp",
        }),
      ],
    });
  });
});

describe("configuration properties", () => {
  const modifierArbitrary = fc.subarray<Modifier>(
    ["alt", "ctrl", "shift", "meta"],
    { minLength: 1 }
  );
  const layerArbitrary = fc.record({
    adapter: fc.option(fc.constantFrom("react", "jsx", "svelte", "vue"), {
      nil: undefined,
    }),
    projectPath: fc.option(
      fc.string({ minLength: 1 }).filter((value) => value.trim().length > 0),
      { nil: undefined }
    ),
    disabled: fc.option(fc.boolean(), { nil: undefined }),
    debugMode: fc.option(fc.boolean(), { nil: undefined }),
    showIntro: fc.option(fc.boolean(), { nil: undefined }),
  });

  test("valid layers have a canonical parse/encode round trip", () => {
    fc.assert(
      fc.property(layerArbitrary, (input) => {
        const first = parseLayer(input);
        expect(first.ok).toBe(true);
        if (!first.ok) return;
        const encoded = encodeLayer(first.value);
        const second = parseLayer(encoded);
        expect(second.ok).toBe(true);
        if (!second.ok) return;
        expect(encodeLayer(second.value)).toEqual(encoded);
      })
    );
  });

  test("modifier order has one canonical chord", () => {
    fc.assert(
      fc.property(modifierArbitrary, (modifiers) => {
        const first = parseLayer({
          bindings: [
            {
              trigger: { kind: "modifier-click", modifiers },
              action: { kind: "copy-path" },
            },
            ...toolbarBindings,
          ],
        });
        const reversed = parseLayer({
          bindings: [
            {
              trigger: {
                kind: "modifier-click",
                modifiers: [...modifiers].reverse(),
              },
              action: { kind: "copy-path" },
            },
            ...toolbarBindings,
          ],
        });
        expect(first.ok && reversed.ok).toBe(true);
        if (!first.ok || !reversed.ok) return;
        expect(encodeLayer(first.value)).toEqual(encodeLayer(reversed.value));
      })
    );
  });

  test("envelope decoding is total for arbitrary JSON-like values", () => {
    fc.assert(
      fc.property(fc.jsonValue(), (value) => {
        expect(() => decodeEnvelope(value)).not.toThrow();
      })
    );
  });

  test("encoding a valid envelope is stable", () => {
    const parsed = parseLayer({
      editor: { kind: "target", id: "vscode" },
      bindings: [
        {
          trigger: { kind: "modifier-click", modifiers: ["shift", "alt"] },
          action: { kind: "open-editor" },
        },
      ],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const envelope = encodeEnvelope(parsed.value, 4);
    const decoded = decodeEnvelope(envelope);
    expect(decoded.kind).toBe("ready");
    if (decoded.kind !== "ready") return;
    expect(encodeEnvelope(decoded.layer, decoded.revision)).toEqual(envelope);
  });

  test("a generated chord always serializes to known nonempty modifiers", () => {
    fc.assert(
      fc.property(
        fc.record({
          alt: fc.boolean(),
          ctrl: fc.boolean(),
          shift: fc.boolean(),
          meta: fc.boolean(),
        }),
        (state) => {
          const chord = modifierChordFromState(state);
          if (chord === null) {
            expect(Object.values(state).every((value) => !value)).toBe(true);
          } else {
            expect(modifiersForChord(chord).length).toBeGreaterThan(0);
          }
        }
      )
    );
  });
});
