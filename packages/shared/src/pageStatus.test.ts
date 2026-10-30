import { afterEach, describe, expect, test } from "vitest";
import {
  PAGE_STATUS_DATASET_KEY,
  decodePageStatus,
  encodePageStatus,
  readPageStatus,
  writePageStatus,
  type PageStatus,
} from "./pageStatus";

afterEach(() => {
  delete document.documentElement.dataset[PAGE_STATUS_DATASET_KEY];
});

describe("page status contract", () => {
  const statuses: PageStatus[] = [
    { kind: "probing" },
    { kind: "ready", adapter: "react", frameworks: ["react", "jsx"] },
    { kind: "disabled" },
    { kind: "no-framework", unsupported: ["Angular"] },
    { kind: "no-source-info", frameworks: ["vue"] },
    { kind: "client-failed", detail: "blocked by CSP" },
  ];

  test.each(statuses)("round-trips %j through the attribute", (status) => {
    writePageStatus(document, status);
    expect(readPageStatus(document)).toEqual(status);
  });

  test("rejects junk a page could plant in the attribute", () => {
    expect(decodePageStatus("not json")).toBeNull();
    expect(decodePageStatus('{"v":1,"kind":"ready"}')).toBeNull();
    expect(decodePageStatus('{"v":2,"kind":"probing"}')).toBeNull();
    expect(decodePageStatus('{"v":1,"kind":"elevated"}')).toBeNull();
    expect(decodePageStatus(42)).toBeNull();
    expect(readPageStatus(document)).toBeNull();
  });

  test("drops unknown frameworks and bounds free text", () => {
    const decoded = decodePageStatus(
      JSON.stringify({
        v: 1,
        kind: "no-source-info",
        frameworks: ["react", "ember", 3],
      })
    );
    expect(decoded).toEqual({ kind: "no-source-info", frameworks: ["react"] });

    const noisy = decodePageStatus(
      JSON.stringify({
        v: 1,
        kind: "no-framework",
        unsupported: ["a", "b", "c", "d", "e", 7, "x".repeat(100)],
      })
    );
    expect(noisy).toEqual({
      kind: "no-framework",
      unsupported: ["a", "b", "c", "d"],
    });

    const failed = decodePageStatus(
      JSON.stringify({ v: 1, kind: "client-failed", detail: "y".repeat(600) })
    );
    expect(failed?.kind === "client-failed" && failed.detail.length).toBe(500);
  });

  test("writes only when the encoded value changed", () => {
    writePageStatus(document, { kind: "probing" });
    const first = document.documentElement.dataset[PAGE_STATUS_DATASET_KEY];
    writePageStatus(document, { kind: "probing" });
    expect(document.documentElement.dataset[PAGE_STATUS_DATASET_KEY]).toBe(
      first
    );
    expect(first).toBe(encodePageStatus({ kind: "probing" }));
  });
});
