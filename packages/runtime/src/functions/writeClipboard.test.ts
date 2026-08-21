// @vitest-environment jsdom
import { beforeEach, describe, expect, test, vi } from "vitest";
import { writeClipboard } from "./writeClipboard";

describe("writeClipboard", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
  });

  test("always removes the fallback textarea when copying throws", async () => {
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: vi.fn(() => {
        throw new DOMException("blocked", "SecurityError");
      }),
    });

    await expect(writeClipboard("source.tsx:1:1")).resolves.toBe(false);
    expect(document.querySelector("textarea")).toBeNull();
  });
});
