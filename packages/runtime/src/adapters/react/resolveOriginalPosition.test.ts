// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  clearSourceMapCache,
  resolveOriginalPosition,
} from "./sourceMapResolver";

/**
 * A real source map, VLQ and all: two segments on generated line 1, at
 * generated columns 40 and 41, mapping to original lines 10 and 20. The
 * adjacent pair is the point -- an off-by-one in the column base picks the
 * wrong one, and the wrong one is on a different original line.
 */
const MAP = {
  version: 3,
  sources: ["file:///repo/src/Button.tsx"],
  names: [],
  // segA: col 40 -> source 0, line 10 (0-based 9), col 5 (0-based 4)
  // segB: col 41 -> source 0, line 20 (0-based 19), col 5
  mappings: "wCASI,CAUA",
};

function mockFetch(handler: (url: string) => Response | undefined) {
  vi.stubGlobal("fetch", async (url: string) => {
    const response = handler(String(url));
    if (response) return response;
    return new Response("", { status: 404 });
  });
}

const okMap = () =>
  new Response(JSON.stringify(MAP), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

beforeEach(() => {
  clearSourceMapCache();
});

afterEach(() => {
  vi.unstubAllGlobals();
  clearSourceMapCache();
});

describe("resolveOriginalPosition - failure is reported as failure", () => {
  test("returns null when the URL has no inferable map", async () => {
    // It used to echo the compiled URL back as a successful resolution, so
    // callers wrote `vscode://file/webpack-internal:///...` into the link and
    // skipped the strategies that actually work.
    mockFetch(() => undefined);

    expect(
      await resolveOriginalPosition(
        "webpack-internal:///(app-pages-browser)/./app/page.tsx",
        12,
        5
      )
    ).toBeNull();
  });

  test("returns null when the .map fetch 404s", async () => {
    mockFetch(() => undefined);

    expect(
      await resolveOriginalPosition("/_next/static/chunks/app.js", 1, 41)
    ).toBeNull();
  });

  test("returns null when the map has no mapping for the position", async () => {
    mockFetch((url) => (url.endsWith(".map") ? okMap() : undefined));

    // Generated line 9 has no segments at all.
    expect(
      await resolveOriginalPosition("/_next/static/chunks/app.js", 9, 1)
    ).toBeNull();
  });
});

describe("resolveOriginalPosition - column bases line up", () => {
  beforeEach(() => {
    mockFetch((url) => (url.endsWith(".map") ? okMap() : undefined));
  });

  test("a 1-based stack column selects its own segment", async () => {
    // Stack traces report 1-based columns; generatedColumn is 0-based. Passing
    // the stack column through raw selected the segment one to the right,
    // which here maps to a different original line entirely.
    expect(
      await resolveOriginalPosition("/_next/static/chunks/app.js", 1, 41)
    ).toEqual({
      fileName: "/repo/src/Button.tsx",
      lineNumber: 10,
      columnNumber: 5,
      pathKind: "absolute",
    });
  });

  test("the next column over selects the next segment", async () => {
    expect(
      await resolveOriginalPosition("/_next/static/chunks/app.js", 1, 42)
    ).toMatchObject({ lineNumber: 20 });
  });

  test("returns a 1-based column, as editor links expect", async () => {
    const resolved = await resolveOriginalPosition(
      "/_next/static/chunks/app.js",
      1,
      41
    );
    // The map encodes original column 4, 0-based.
    expect(resolved?.columnNumber).toBe(5);
  });

  test("converts the source's file:// URL to a path", async () => {
    const resolved = await resolveOriginalPosition(
      "/_next/static/chunks/app.js",
      1,
      41
    );
    expect(resolved?.fileName).toBe("/repo/src/Button.tsx");
  });
});
