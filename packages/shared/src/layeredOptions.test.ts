import { describe, expect, test } from "vitest";
import {
  DEFAULT_LAYER,
  LocatorLayer,
  LocatorOptions,
  resolve,
  normalizeLayer,
  primaryEditorBinding,
  resolveBindingTarget,
  resolveTarget,
} from "./layeredOptions";
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
      default: { targetId: "default-t" },
      team: { targetId: "team-t" },
      "user-extension": { targetId: "user-ext-t" },
      "user-origin": { targetId: "user-proj-t" },
    };
    const layers: Partial<Record<LocatorLayer, LocatorOptions>> = {};
    for (const l of present) layers[l] = optionPerLayer[l];

    const { effective, provenance } = resolve(layers);

    if (present.length === 0) {
      expect(effective.targetId).toBeUndefined();
      expect(provenance.targetId).toBeUndefined();
    } else {
      const winner = present[present.length - 1]!;
      expect(effective.targetId).toBe(optionPerLayer[winner].targetId);
      expect(provenance.targetId).toBe(winner);
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
    expect(effective.bindings?.[0]).toEqual({
      modifiers: "alt",
      action: { kind: "open-editor" },
    });
    expect(effective.bindings).toHaveLength(4);
    expect(provenance.bindings).toBe("default");
  });
});

describe("resolve – atomic target slot", () => {
  test("user targetId overrides team targetTemplate", () => {
    const { effective, provenance } = resolve({
      team: { targetTemplate: "team://${filePath}" },
      "user-origin": { targetId: "vscode" },
    });
    expect(effective.targetTemplate).toBeUndefined();
    expect(effective.targetId).toBe("vscode");
    expect(provenance.targetTemplate).toBeUndefined();
    expect(provenance.targetId).toBe("user-origin");
  });

  test("user targetTemplate overrides team targetId", () => {
    const { effective, provenance } = resolve({
      team: { targetId: "webstorm" },
      "user-origin": { targetTemplate: "custom://${filePath}" },
    });
    expect(effective.targetId).toBeUndefined();
    expect(effective.targetTemplate).toBe("custom://${filePath}");
    expect(provenance.targetTemplate).toBe("user-origin");
  });

  test("layer without any target field leaves lower target intact", () => {
    const { effective, provenance } = resolve({
      team: { targetTemplate: "team://${filePath}" },
      "user-origin": { projectPath: "/repo/" },
    });
    expect(effective.targetTemplate).toBe("team://${filePath}");
    expect(provenance.targetTemplate).toBe("team");
    expect(provenance.projectPath).toBe("user-origin");
  });

  test("layer setting both target fields carries both (template wins in resolveTarget)", () => {
    const { effective, provenance } = resolve({
      team: { targetId: "webstorm" },
      "user-origin": {
        targetId: "vscode",
        targetTemplate: "custom://${filePath}",
      },
    });
    expect(effective.targetId).toBe("vscode");
    expect(effective.targetTemplate).toBe("custom://${filePath}");
    expect(provenance.targetId).toBe("user-origin");
    expect(provenance.targetTemplate).toBe("user-origin");
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
      { modifiers: "alt+shift", action: { kind: "open-editor" } },
      { icon: true, action: { kind: "show-tree" } },
      { icon: true, action: { kind: "show-parents" } },
      { icon: true, action: { kind: "copy-path" } },
    ]);
  });

  test("explicit bindings beat a legacy key in the same layer", () => {
    const bindings = [
      { modifiers: "meta", action: { kind: "copy-path" } },
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
        bindings: [{ modifiers: "alt", action: { kind: "copy-prompt" } }],
      },
      "user-origin": { mouseModifiers: "ctrl" },
    });
    expect(result.effective.bindings?.[0]).toEqual({
      modifiers: "ctrl",
      action: { kind: "open-editor" },
    });
    expect(result.effective.bindings).toHaveLength(4);
    expect(result.provenance.bindings).toBe("user-origin");
  });

  test("finds the primary modifier-triggered editor binding", () => {
    expect(
      primaryEditorBinding([
        { icon: true, action: { kind: "open-editor" } },
        { modifiers: "shift", action: { kind: "copy-path" } },
        { modifiers: "meta", action: { kind: "open-editor" } },
      ])?.modifiers
    ).toBe("meta");
  });

  test("binding target overrides the default editor", () => {
    const targets: Targets = {
      vscode: { label: "VS Code", url: "vscode://file/${filePath}" },
      cursor: { label: "Cursor", url: "cursor://file/${filePath}" },
    };
    expect(
      resolveBindingTarget(
        { kind: "open-editor", targetId: "cursor" },
        { targetId: "vscode" },
        targets
      )
    ).toMatchObject({ kind: "targetId", id: "cursor" });
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
      expect(r.url).toBe(targets.webstorm!.url);
    }
  });

  test("unknown targetId falls back to first target with unknown-id reason", () => {
    const r = resolveTarget({ targetId: "nonexistent" }, targets);
    expect(r.kind).toBe("fallback");
    if (r.kind === "fallback") {
      expect(r.reason).toBe("unknown-id");
      expect(r.id).toBe("vscode");
      expect(r.url).toBe(targets.vscode!.url);
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
