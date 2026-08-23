import { describe, expect, test } from "vitest";
import {
  DEFAULT_LAYER,
  LocatorLayer,
  LocatorOptions,
  hasEditorOverride,
  needsEditorSetup,
  resolve,
  normalizeLayer,
  primaryEditorBinding,
  primaryEditorShortcut,
  resolveBindingTarget,
  resolveEditorTarget,
  resolveTarget,
  type Binding,
} from "./layeredOptions";
import { duplicateShortcutModifiers } from "./bindingEditorModel";
import type { Targets } from "./index";

const layerCombos: LocatorLayer[][] = [
  [],
  ["default"],
  ["team"],
  ["user-extension"],
  ["user-origin"],
  ["default", "team"],
  ["default", "user-extension"],
  ["default", "user-origin"],
  ["team", "user-extension"],
  ["team", "user-origin"],
  ["user-extension", "user-origin"],
  ["default", "team", "user-extension"],
  ["default", "team", "user-origin"],
  ["default", "user-extension", "user-origin"],
  ["team", "user-extension", "user-origin"],
  ["default", "team", "user-extension", "user-origin"],
];

describe("resolve – 16 layer presence permutations", () => {
  test.each(layerCombos)("layers %j", (...present) => {
    const optionPerLayer: Record<LocatorLayer, LocatorOptions> = {
      default: { projectPath: "/default" },
      team: { projectPath: "/team" },
      "user-extension": { projectPath: "/user-extension" },
      "user-origin": { projectPath: "/user-origin" },
    };
    const layers: Partial<Record<LocatorLayer, LocatorOptions>> = {};
    for (const l of present) layers[l] = optionPerLayer[l];

    const { effective, provenance } = resolve(layers);

    if (present.length === 0) {
      expect(effective.projectPath).toBeUndefined();
      expect(provenance.projectPath).toBeUndefined();
    } else {
      const winner = present[present.length - 1]!;
      expect(effective.projectPath).toBe(optionPerLayer[winner].projectPath);
      expect(provenance.projectPath).toBe(winner);
    }
  });
});

describe("resolve – value semantics", () => {
  test("boolean false in later layer overrides true in earlier layer", () => {
    const { effective, provenance } = resolve({
      team: { disabled: true },
      "user-origin": { disabled: false },
    });
    expect(effective.disabled).toBe(false);
    expect(provenance.disabled).toBe("user-origin");
  });

  test("undefined in later layer does not override earlier layer", () => {
    const { effective, provenance } = resolve({
      team: { disabled: true },
      "user-origin": { disabled: undefined },
    });
    expect(effective.disabled).toBe(true);
    expect(provenance.disabled).toBe("team");
  });

  test("replacePath merges atomically (later layer wins whole object)", () => {
    const { effective, provenance } = resolve({
      team: { replacePath: { from: "/team-from", to: "/team-to" } },
      "user-origin": {
        replacePath: { from: "/user-from", to: "/user-to" },
      },
    });
    expect(effective.replacePath).toEqual({
      from: "/user-from",
      to: "/user-to",
    });
    expect(provenance.replacePath).toBe("user-origin");
  });

  test("DEFAULT_LAYER provides the legacy-equivalent bindings", () => {
    const { effective, provenance } = resolve({ default: DEFAULT_LAYER });
    // The default editor action carries no target: it follows the global
    // Editor setting, which the same layer defaults to VS Code.
    expect(effective.bindings?.[0]).toEqual({
      trigger: { kind: "modifier-click", modifiers: "alt" },
      action: { kind: "open-editor" },
    });
    expect(effective.editor).toEqual({ targetId: "vscode" });
    expect(effective.bindings).toHaveLength(4);
    expect(provenance.bindings).toBe("default");
    expect(provenance.editor).toBe("default");
  });

  test("editor is atomic: a higher layer replaces both fields", () => {
    const { effective, provenance } = resolve({
      default: DEFAULT_LAYER,
      team: { editor: { targetTemplate: "team://${filePath}" } },
    });
    expect(effective.editor).toEqual({ targetTemplate: "team://${filePath}" });
    expect(provenance.editor).toBe("team");
  });
});

describe("resolve – action-owned editor and prompt settings", () => {
  test("ignores deprecated global editor and prompt values", () => {
    const { effective, provenance } = resolve({
      team: {
        targetId: "webstorm",
        targetTemplate: "team://${filePath}",
        promptTemplate: "legacy prompt",
        projectPath: "/repo",
      } as LocatorOptions,
    });

    expect(effective).toEqual({ projectPath: "/repo" });
    expect(provenance).toEqual({ projectPath: "team" });
  });
});

describe("bindings compatibility", () => {
  test("normalizes an absent optional layer to an empty layer", () => {
    expect(normalizeLayer()).toEqual({});
  });

  test("normalizes a legacy modifier with the three legacy hover actions", () => {
    const normalized = normalizeLayer({ mouseModifiers: "alt+shift" });
    expect(normalized.mouseModifiers).toBeUndefined();
    expect(normalized.bindings).toEqual([
      {
        trigger: { kind: "modifier-click", modifiers: "alt+shift" },
        action: { kind: "open-editor" },
      },
      { trigger: { kind: "hover-toolbar" }, action: { kind: "show-tree" } },
      {
        trigger: { kind: "hover-toolbar" },
        action: { kind: "show-parents" },
      },
      { trigger: { kind: "hover-toolbar" }, action: { kind: "copy-path" } },
    ]);
  });

  test("explicit bindings beat a legacy key in the same layer", () => {
    const bindings = [
      {
        trigger: { kind: "modifier-click", modifiers: "meta" },
        action: { kind: "copy-path" },
      },
    ] as const;
    expect(
      normalizeLayer({
        mouseModifiers: "alt",
        bindings: [...bindings],
      })
    ).toEqual({ bindings });
  });

  test("a legacy higher layer atomically replaces lower bindings", () => {
    const result = resolve({
      team: {
        bindings: [
          {
            trigger: { kind: "modifier-click", modifiers: "alt" },
            action: { kind: "copy-prompt" },
          },
        ],
      },
      "user-origin": { mouseModifiers: "ctrl" },
    });
    expect(result.effective.bindings?.[0]).toEqual({
      trigger: { kind: "modifier-click", modifiers: "ctrl" },
      action: { kind: "open-editor" },
    });
    expect(result.effective.bindings).toHaveLength(4);
    expect(result.provenance.bindings).toBe("user-origin");
  });

  test("finds the primary modifier-triggered editor binding", () => {
    expect(
      primaryEditorBinding([
        {
          trigger: { kind: "hover-toolbar" },
          action: { kind: "open-editor" },
        },
        {
          trigger: { kind: "modifier-click", modifiers: "shift" },
          action: { kind: "copy-path" },
        },
        {
          trigger: { kind: "modifier-click", modifiers: "meta" },
          action: { kind: "open-editor" },
        },
      ])?.trigger
    ).toEqual({ kind: "modifier-click", modifiers: "meta" });
  });

  test("falls back to an icon-only editor binding", () => {
    expect(
      primaryEditorBinding([
        {
          trigger: { kind: "hover-toolbar" },
          action: { kind: "open-editor", targetId: "cursor" },
        },
      ])?.action
    ).toEqual({ kind: "open-editor", targetId: "cursor" });
  });

  test("binding target overrides the default editor", () => {
    const targets: Targets = {
      vscode: { label: "VS Code", url: "vscode://file/${filePath}" },
      cursor: { label: "Cursor", url: "cursor://file/${filePath}" },
    };
    expect(
      resolveBindingTarget({ kind: "open-editor", targetId: "cursor" }, targets)
    ).toMatchObject({ kind: "targetId", id: "cursor" });
  });

  test("an editor binding without a target follows the Editor setting", () => {
    const targets: Targets = {
      cursor: { label: "Cursor", url: "cursor://file/${filePath}" },
      vscode: { label: "VS Code", url: "vscode://file/${filePath}" },
    };
    expect(
      resolveBindingTarget({ kind: "open-editor" }, targets, {
        targetId: "vscode",
      })
    ).toMatchObject({ kind: "targetId", id: "vscode" });
    // An override on the action wins over the setting.
    expect(
      resolveBindingTarget(
        { kind: "open-editor", targetId: "cursor" },
        targets,
        {
          targetId: "vscode",
        }
      )
    ).toMatchObject({ kind: "targetId", id: "cursor" });
  });

  test("an unconfigured editor resolves to a fallback that needs setup", () => {
    const targets: Targets = {
      cursor: { label: "Cursor", url: "cursor://file/${filePath}" },
      vscode: { label: "VS Code", url: "vscode://file/${filePath}" },
    };
    // Nothing chosen anywhere: the destination would be a guess, so callers
    // are told to ask the user rather than opening the first target blindly.
    const unset = resolveBindingTarget({ kind: "open-editor" }, targets);
    expect(unset).toMatchObject({ kind: "fallback", reason: "none-selected" });
    expect(needsEditorSetup(unset)).toBe(true);

    // A configured editor is a choice, not a guess.
    expect(
      needsEditorSetup(resolveEditorTarget({ targetId: "cursor" }, targets))
    ).toBe(false);
    // So is an id that no longer exists — but it still reports as a fallback.
    const unknown = resolveEditorTarget({ targetId: "nope" }, targets);
    expect(unknown).toMatchObject({ kind: "fallback", reason: "unknown-id" });
    expect(needsEditorSetup(unknown)).toBe(true);
  });

  test("hasEditorOverride distinguishes pinned actions from following ones", () => {
    expect(hasEditorOverride({ kind: "open-editor" })).toBe(false);
    expect(hasEditorOverride({ kind: "open-editor", targetId: "cursor" })).toBe(
      true
    );
    expect(
      hasEditorOverride({
        kind: "open-editor",
        targetTemplate: "x://${filePath}",
      })
    ).toBe(true);
  });
});

describe("resolveTarget – split-field semantics", () => {
  const targets: Targets = {
    vscode: {
      url: "vscode://file/${projectPath}${filePath}:${line}:${column}",
      label: "VSCode",
    },
    webstorm: {
      url: "webstorm://file=${filePath}",
      label: "WebStorm",
    },
  };

  test("targetTemplate beats targetId when both present", () => {
    const r = resolveTarget(
      { targetId: "vscode", targetTemplate: "custom://${filePath}" },
      targets
    );
    expect(r.kind).toBe("template");
    expect(r.url).toBe("custom://${filePath}");
  });

  test("targetId resolves to target url when present in map", () => {
    const r = resolveTarget({ targetId: "webstorm" }, targets);
    expect(r.kind).toBe("targetId");
    if (r.kind === "targetId") {
      expect(r.id).toBe("webstorm");
      expect(r.url).toBe(targets.webstorm?.url);
    }
  });

  test("unknown targetId falls back to first target with unknown-id reason", () => {
    const r = resolveTarget({ targetId: "nonexistent" }, targets);
    expect(r.kind).toBe("fallback");
    if (r.kind === "fallback") {
      expect(r.reason).toBe("unknown-id");
      expect(r.id).toBe("vscode");
      expect(r.url).toBe(targets.vscode?.url);
    }
  });

  test("no target selected falls back to first target with none-selected reason", () => {
    const r = resolveTarget({}, targets);
    expect(r.kind).toBe("fallback");
    if (r.kind === "fallback") {
      expect(r.reason).toBe("none-selected");
      expect(r.id).toBe("vscode");
    }
  });

  test("no targets at all falls back with empty reason", () => {
    const r = resolveTarget({}, {});
    expect(r.kind).toBe("fallback");
    if (r.kind === "fallback") {
      expect(r.reason).toBe("empty");
      expect(r.id).toBe("");
      expect(r.url).toBe("");
    }
  });
});

describe("normalizeLayer - canonical shortcut spelling", () => {
  test("rewrites a stored shortcut into canonical order", () => {
    // Stored values predate the canonical writer, and every editor guard
    // compares the raw string, so "shift+alt" and "alt+shift" read as two
    // different shortcuts: two bindings could claim one combination with no
    // duplicate warning, and the second could never fire.
    const normalized = normalizeLayer({
      bindings: [
        {
          trigger: { kind: "modifier-click", modifiers: "shift+alt" },
          action: { kind: "open-editor" },
        },
      ],
    });

    expect(normalized.bindings?.[0]?.trigger).toEqual({
      kind: "modifier-click",
      modifiers: "alt+shift",
    });
  });

  test("two spellings of one combination are seen as duplicates", () => {
    const normalized = normalizeLayer({
      bindings: [
        {
          trigger: { kind: "modifier-click", modifiers: "alt+shift" },
          action: { kind: "open-editor" },
        },
        {
          trigger: { kind: "modifier-click", modifiers: "shift+alt" },
          action: { kind: "copy-path" },
        },
      ],
    });

    expect(duplicateShortcutModifiers(normalized.bindings ?? [])).toEqual(
      new Set(["alt+shift"])
    );
  });

  test("canonicalises the legacy mouseModifiers string too", () => {
    const normalized = normalizeLayer({ mouseModifiers: "shift+alt" });

    expect(normalized.bindings?.[0]?.trigger).toEqual({
      kind: "modifier-click",
      modifiers: "alt+shift",
    });
  });

  test("returns the same bindings array when nothing needed rewriting", () => {
    const bindings: Binding[] = [
      {
        trigger: { kind: "modifier-click", modifiers: "alt+shift" },
        action: { kind: "open-editor" },
      },
    ];

    expect(normalizeLayer({ bindings }).bindings).toBe(bindings);
  });
});

describe("primaryEditorShortcut", () => {
  const toolbarOnly: Binding[] = [
    { trigger: { kind: "hover-toolbar" }, action: { kind: "open-editor" } },
  ];

  test("reports no shortcut when only a toolbar button opens the editor", () => {
    // `primaryEditorBinding` answers "what opens the editor" and falls back to
    // a toolbar button. Using it to answer "which shortcut opens the editor"
    // made the intro banner advertise an Alt+click that never matches.
    expect(primaryEditorBinding(toolbarOnly)).toBe(toolbarOnly[0]);
    expect(primaryEditorShortcut(toolbarOnly)).toBeUndefined();
  });

  test("finds the modifier-click shortcut when there is one", () => {
    const bindings: Binding[] = [
      ...toolbarOnly,
      {
        trigger: { kind: "modifier-click", modifiers: "ctrl+shift" },
        action: { kind: "open-editor" },
      },
    ];

    expect(primaryEditorShortcut(bindings)).toBe(bindings[1]);
  });

  test("ignores a shortcut bound to something other than the editor", () => {
    expect(
      primaryEditorShortcut([
        {
          trigger: { kind: "modifier-click", modifiers: "alt" },
          action: { kind: "copy-path" },
        },
      ])
    ).toBeUndefined();
  });
});
