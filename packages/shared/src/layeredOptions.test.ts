import { describe, expect, test } from "vitest";
import {
  DEFAULT_LAYER,
  LocatorLayer,
  LocatorOptions,
  resolve,
  resolveTarget,
} from "./layeredOptions";
import type { Targets } from "./index";

const layerCombos: LocatorLayer[][] = [
  [],
  ["default"],
  ["team"],
  ["user-extension"],
  ["user-project"],
  ["default", "team"],
  ["default", "user-extension"],
  ["default", "user-project"],
  ["team", "user-extension"],
  ["team", "user-project"],
  ["user-extension", "user-project"],
  ["default", "team", "user-extension"],
  ["default", "team", "user-project"],
  ["default", "user-extension", "user-project"],
  ["team", "user-extension", "user-project"],
  ["default", "team", "user-extension", "user-project"],
];

describe("resolve – 16 layer presence permutations", () => {
  test.each(layerCombos)("layers %j", (...present) => {
    const optionPerLayer: Record<LocatorLayer, LocatorOptions> = {
      default: { targetId: "default-t" },
      team: { targetId: "team-t" },
      "user-extension": { targetId: "user-ext-t" },
      "user-project": { targetId: "user-proj-t" },
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
      "user-project": { disabled: false },
    });
    expect(effective.disabled).toBe(false);
    expect(provenance.disabled).toBe("user-project");
  });

  test("undefined in later layer does not override earlier layer", () => {
    const { effective, provenance } = resolve({
      team: { disabled: true },
      "user-project": { disabled: undefined },
    });
    expect(effective.disabled).toBe(true);
    expect(provenance.disabled).toBe("team");
  });

  test("replacePath merges atomically (later layer wins whole object)", () => {
    const { effective, provenance } = resolve({
      team: { replacePath: { from: "/team-from", to: "/team-to" } },
      "user-project": {
        replacePath: { from: "/user-from", to: "/user-to" },
      },
    });
    expect(effective.replacePath).toEqual({
      from: "/user-from",
      to: "/user-to",
    });
    expect(provenance.replacePath).toBe("user-project");
  });

  test("DEFAULT_LAYER provides mouseModifiers fallback", () => {
    const { effective, provenance } = resolve({ default: DEFAULT_LAYER });
    expect(effective.mouseModifiers).toBe("alt");
    expect(provenance.mouseModifiers).toBe("default");
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

  test("empty effective falls back to first target with empty reason", () => {
    const r = resolveTarget({}, targets);
    expect(r.kind).toBe("fallback");
    if (r.kind === "fallback") {
      expect(r.reason).toBe("empty");
      expect(r.id).toBe("vscode");
    }
  });
});
