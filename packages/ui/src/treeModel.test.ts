import { describe, expect, test } from "vitest";
import { formatSourceRef, visibleTreeRows, type TreeRow } from "./treeModel";

function row(id: string, children: TreeRow[] = []): TreeRow {
  return {
    id,
    kind: "element",
    label: id,
    source: null,
    hasChildren: children.length > 0,
    children,
  };
}

describe("visibleTreeRows", () => {
  const tree = [row("a", [row("a1", [row("a1x")]), row("a2")]), row("b")];

  test("hides the children of collapsed rows", () => {
    expect(visibleTreeRows(tree, new Set()).map((item) => item.row.id)).toEqual(
      ["a", "b"]
    );
  });

  test("flattens depth-first in the order the user sees", () => {
    expect(
      visibleTreeRows(tree, new Set(["a", "a1"])).map((item) => item.row.id)
    ).toEqual(["a", "a1", "a1x", "a2", "b"]);
  });

  test("reports the depth each row is indented to", () => {
    expect(
      visibleTreeRows(tree, new Set(["a", "a1"])).map((item) => [
        item.row.id,
        item.depth,
      ])
    ).toEqual([
      ["a", 0],
      ["a1", 1],
      ["a1x", 2],
      ["a2", 1],
      ["b", 0],
    ]);
  });

  test("reports each row's position among its real siblings", () => {
    expect(
      visibleTreeRows(tree, new Set(["a", "a1"])).map((item) => [
        item.row.id,
        item.posInSet,
        item.setSize,
      ])
    ).toEqual([
      ["a", 1, 2],
      ["a1", 1, 2],
      ["a1x", 1, 1],
      ["a2", 2, 2],
      ["b", 2, 2],
    ]);
  });

  test("expanding a row whose children are not mapped yet adds nothing", () => {
    // The runtime only maps children of expanded rows, so an id can be
    // expanded a frame before its children arrive.
    const lazy: TreeRow[] = [{ ...row("a"), hasChildren: true, children: [] }];
    expect(visibleTreeRows(lazy, new Set(["a"]))).toHaveLength(1);
  });

  test("an empty tree is not an error", () => {
    expect(visibleTreeRows([], new Set())).toEqual([]);
  });
});

describe("formatSourceRef", () => {
  test("renders a full file:line:column reference", () => {
    expect(
      formatSourceRef({ filePath: "/repo/src/App.tsx", line: 8, column: 2 })
    ).toBe("/repo/src/App.tsx:8:2");
  });

  test("an absent source formats as nothing at all", () => {
    expect(formatSourceRef(null)).toBe("");
  });
});
