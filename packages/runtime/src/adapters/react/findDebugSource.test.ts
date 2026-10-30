import type { Fiber } from "@locator/shared";
import { afterEach, describe, expect, test } from "vitest";
import { findDebugSource, findOwnDebugSource } from "./findDebugSource";
import { resetSourceResolutionCaches } from "./clickSourceResolver";

function fiber(fields: Partial<Fiber>): Fiber {
  return fields as Fiber;
}

afterEach(() => resetSourceResolutionCaches());

describe("findDebugSource", () => {
  test("rejects compiled locations from synchronous React metadata", () => {
    const compiled = fiber({
      _debugSource: {
        fileName: "webpack-internal:///./app/page.tsx",
        lineNumber: 10,
        columnNumber: 2,
      },
      _debugOwner: null,
    });

    expect(findOwnDebugSource(compiled)).toBeNull();
    expect(findDebugSource(compiled)).toBeNull();
  });

  test("reports an owner source as fallback rather than the fiber's own", () => {
    const owner = fiber({
      _debugSource: {
        fileName: "/repo/app/Card.tsx",
        lineNumber: 4,
        columnNumber: 1,
      },
      _debugOwner: null,
    });
    const child = fiber({
      _debugSource: {
        fileName: "webpack-internal:///./app/page.tsx",
        lineNumber: 10,
        columnNumber: 2,
      },
      _debugOwner: owner,
    });

    expect(findOwnDebugSource(child)).toBeNull();
    expect(findDebugSource(child)).toEqual({
      fiber: owner,
      source: owner._debugSource,
    });
  });
});
