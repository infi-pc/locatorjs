import { describe, expect, test } from "vitest";
import {
  decodeBindingAction,
  decodeLocatorLayers,
  decodeLocatorOptions,
  decodeStoredLocatorOptions,
  decodeProvenance,
  decodeTargets,
  isSafeTargetTemplate,
} from "./optionsCodec";
import { resolve } from "./layeredOptions";

describe("options codec", () => {
  test("rebuilds a valid options object", () => {
    const raw = {
      editor: { targetId: "cursor" },
      bindings: [
        {
          trigger: { kind: "modifier-click", modifiers: "alt" },
          action: { kind: "open-editor" },
        },
      ],
      disabled: false,
    };
    const decoded = decodeLocatorOptions(raw);
    expect(decoded).toEqual(raw);
    expect(decoded).not.toBe(raw);
    expect(decoded?.editor).not.toBe(raw.editor);
  });

  test("rejects unknown and inherited option keys", () => {
    expect(
      decodeLocatorOptions({ projectPath: "/repo", surprise: true })
    ).toBeNull();
    const polluted = JSON.parse('{"__proto__":{"editor":{"targetId":"evil"}}}');
    expect(decodeLocatorOptions(polluted)).toBeNull();
    const { effective } = resolve({ team: polluted });
    expect(Object.getPrototypeOf(effective)).toBe(Object.prototype);
    expect(effective.editor).toBeUndefined();
  });

  test("salvages valid fields from long-lived storage", () => {
    expect(
      decodeStoredLocatorOptions({
        projectPath: "/repo",
        disabled: "not-a-boolean",
        futureOption: true,
      })
    ).toEqual({ projectPath: "/repo" });
  });

  test.each(["javascript:alert(1)", "data:text/html,x", "blob:https://x/y"])(
    "rejects active template %s",
    (template) => {
      expect(isSafeTargetTemplate(template)).toBe(false);
      expect(
        decodeBindingAction({ kind: "open-editor", targetTemplate: template })
      ).toBeNull();
    }
  );

  test("allows custom editor schemes with template variables", () => {
    expect(isSafeTargetTemplate("my-editor://open/${filePath}:${line}")).toBe(
      true
    );
  });

  test("deep-validates layers, provenance and targets", () => {
    expect(decodeLocatorLayers({ team: { projectPath: "/repo" } })).toEqual({
      team: { projectPath: "/repo" },
    });
    expect(decodeLocatorLayers({ hostile: {} })).toBeNull();
    expect(decodeProvenance({ editor: "team" })).toEqual({ editor: "team" });
    expect(decodeProvenance({ editor: "hostile" })).toBeNull();
    expect(
      decodeTargets({
        cursor: { label: "Cursor", url: "cursor://${filePath}" },
      })
    ).toEqual({
      cursor: { label: "Cursor", url: "cursor://${filePath}" },
    });
    expect(
      decodeTargets({ bad: { label: "Bad", url: "javascript:alert(1)" } })
    ).toBeNull();
  });
});
