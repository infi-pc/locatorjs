import { describe, expect, test } from "vitest";
import { deserializePatch, serializePatch } from "./patchCodec";

describe("patch codec", () => {
  test("round-trips explicit undefined values through JSON", () => {
    const wireValue = JSON.parse(
      JSON.stringify(
        serializePatch({
          projectPath: undefined,
          tmuxSession: "work",
          debugMode: false,
        })
      )
    );

    expect(deserializePatch(wireValue.patch, wireValue.unset)).toEqual({
      projectPath: undefined,
      tmuxSession: "work",
      debugMode: false,
    });
  });

  test("defined-only patches have no unset keys", () => {
    expect(serializePatch({ projectPath: "/repo" })).toEqual({
      patch: { projectPath: "/repo" },
      unset: [],
    });
  });

  test.each([undefined, null, "projectPath", { 0: "projectPath" }])(
    "tolerates a missing or non-array unset value",
    (unset) => {
      expect(deserializePatch({ projectPath: "/repo" }, unset)).toEqual({
        projectPath: "/repo",
      });
    }
  );
});
