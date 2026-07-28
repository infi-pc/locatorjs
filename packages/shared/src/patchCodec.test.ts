import { describe, expect, test } from "vitest";
import { deserializePatch, serializePatch } from "./patchCodec";

describe("patch codec", () => {
  test("round-trips explicit undefined values through JSON", () => {
    const wireValue = JSON.parse(
      JSON.stringify(
        serializePatch({
          targetId: undefined,
          targetTemplate: "zed://file/${filePath}",
          debugMode: false,
        })
      )
    );

    expect(deserializePatch(wireValue.patch, wireValue.unset)).toEqual({
      targetId: undefined,
      targetTemplate: "zed://file/${filePath}",
      debugMode: false,
    });
  });

  test("defined-only patches have no unset keys", () => {
    expect(serializePatch({ projectPath: "/repo" })).toEqual({
      patch: { projectPath: "/repo" },
      unset: [],
    });
  });

  test.each([undefined, null, "targetId", { 0: "targetId" }])(
    "tolerates a missing or non-array unset value",
    (unset) => {
      expect(deserializePatch({ targetId: "vscode" }, unset)).toEqual({
        targetId: "vscode",
      });
    }
  );
});
