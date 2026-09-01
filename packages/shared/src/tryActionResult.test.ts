import { describe, expect, test } from "vitest";
import { decodeTryActionResult } from "./tryActionResult";

describe("decodeTryActionResult", () => {
  test("preserves protocol reasons and strips extra fields", () => {
    expect(
      decodeTryActionResult({ ok: false, reason: "disabled", extra: true })
    ).toEqual({ ok: false, reason: "disabled" });
  });

  test("maps unknown reasons to the closed fallback", () => {
    expect(decodeTryActionResult({ ok: false, reason: "hunter2" })).toEqual({
      ok: false,
      reason: "unknown",
    });
  });

  test.each([null, [], {}, { ok: "yes" }])(
    "rejects a malformed result: %j",
    (value) => {
      expect(decodeTryActionResult(value)).toBeNull();
    }
  );
});
