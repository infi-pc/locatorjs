import { describe, expect, test } from "vitest";
import { extractSourceNearPosition } from "./clickSourceResolver";

/**
 * How a JSX transform compiles `<div className="card"><span>x</span></div>`:
 * the outer element's source literal comes *after* the whole props object, so
 * the first literal following the `"card"` attribute is the span's.
 */
const NESTED = `_jsxDEV("div", { className: "card", children: _jsxDEV("span", { children: "x" }, void 0, false, { fileName: "/app/a.tsx", lineNumber: 5, columnNumber: 25 }, this) }, void 0, false, { fileName: "/app/a.tsx", lineNumber: 4, columnNumber: 3 }, this)`;

const COMPONENT = `_jsxDEV(Card, { title: "hi" }, void 0, false, { fileName: "/app/App.tsx", lineNumber: 12, columnNumber: 7 }, this)`;

describe("extractSourceNearPosition - which literal belongs to the call", () => {
  test("an attribute search skips the nested child's literal", () => {
    // Clicking the div used to navigate to line 5, the span's line.
    const attrIndex = NESTED.indexOf('"card"');

    expect(extractSourceNearPosition(NESTED, attrIndex, -1)).toEqual({
      fileName: "/app/a.tsx",
      lineNumber: 4,
      columnNumber: 3,
    });
  });

  test("a call search takes the call's own literal", () => {
    const callIndex = COMPONENT.indexOf("Card");

    expect(extractSourceNearPosition(COMPONENT, callIndex, 0)).toEqual({
      fileName: "/app/App.tsx",
      lineNumber: 12,
      columnNumber: 7,
    });
  });

  test("the nested child's own attribute still resolves to the child", () => {
    const childIndex = NESTED.indexOf('"x"');

    expect(extractSourceNearPosition(NESTED, childIndex, -1)).toMatchObject({
      lineNumber: 5,
    });
  });
});

describe("extractSourceNearPosition - fields come from one object", () => {
  test("will not stitch a filename and a line from two literals", () => {
    // Three independent regexes over a forward window could take `fileName`
    // from one object and `lineNumber` from the next.
    const split = `_jsxDEV("div", { id: "a" }, void 0, false, { fileName: "/app/a.tsx" }, this), { lineNumber: 99 }`;
    const attrIndex = split.indexOf('"a"');

    expect(extractSourceNearPosition(split, attrIndex, -1)).toBeNull();
  });

  test("returns null when there is no literal in range", () => {
    expect(
      extractSourceNearPosition('_jsxDEV("div", { id: "a" })', 0, 0)
    ).toBeNull();
  });

  test("does not look past the search window", () => {
    const far = `${"x".repeat(
      2000
    )}{ fileName: "/app/a.tsx", lineNumber: 1, columnNumber: 1 }`;

    expect(extractSourceNearPosition(far, 0, 0)).toBeNull();
  });
});
