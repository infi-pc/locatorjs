import { describe, expect, test } from "vitest";
import {
  canonicalModifiers,
  getModifiersMap,
  getModifiersString,
} from "./modifiers";

describe("getModifiersString", () => {
  test("writes a combination in canonical order, not click order", () => {
    // Toggling Alt on after starting from Shift used to emit "shift+alt",
    // which every editor guard read as a different shortcut from "alt+shift".
    expect(getModifiersString({ shift: true, alt: true })).toBe("alt+shift");
    expect(getModifiersString({ alt: true, shift: true })).toBe("alt+shift");
  });

  test("orders all four consistently", () => {
    expect(
      getModifiersString({ meta: true, shift: true, ctrl: true, alt: true })
    ).toBe("alt+ctrl+shift+meta");
  });

  test("still round-trips an unrecognised modifier", () => {
    expect(getModifiersString({ hyper: true, alt: true })).toBe("alt+hyper");
  });

  test("empty map is the empty string", () => {
    expect(getModifiersString({})).toBe("");
  });
});

describe("canonicalModifiers", () => {
  test("collapses the spellings of one combination", () => {
    expect(canonicalModifiers("shift+alt")).toBe("alt+shift");
    expect(canonicalModifiers("alt+shift")).toBe("alt+shift");
    expect(canonicalModifiers(" alt + shift ")).toBe("alt+shift");
  });

  test("is idempotent", () => {
    expect(canonicalModifiers(canonicalModifiers("meta+alt"))).toBe("alt+meta");
  });

  test("passes an empty value through", () => {
    expect(canonicalModifiers("")).toBe("");
  });
});

describe("getModifiersMap", () => {
  test("ignores whitespace around each modifier", () => {
    expect(getModifiersMap(" alt + shift ")).toEqual({
      alt: true,
      shift: true,
    });
  });
});
