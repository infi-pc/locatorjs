import { describe, expect, test } from "vitest";
import { BUNDLE_TYPE_DEV, isValidRenderer } from "./isValidRenderer";

const renderer = (version: string) => ({
  rendererPackageName: "react-dom",
  version,
  bundleType: BUNDLE_TYPE_DEV,
});

describe("isValidRenderer", () => {
  test.each([
    ["16.8.9", false],
    ["16.9.0-rc.0", false],
    ["16.9.0", true],
    ["16.10.0-alpha.0", true],
    ["17.0.0", true],
    ["not-a-version", false],
  ])("compares React version %s without shipping semver", (version, valid) => {
    expect(isValidRenderer(renderer(version))).toBe(valid);
  });
});
