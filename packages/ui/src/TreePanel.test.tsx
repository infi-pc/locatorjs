import { cleanup, fireEvent, render, screen } from "@solidjs/testing-library";
import { afterEach, describe, expect, test, vi } from "vitest";
import { TreePanel } from "./TreePanel";
import type { TreeRow, TreeViewModel } from "./treeModel";

afterEach(cleanup);

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

const model: TreeViewModel = {
  rows: [row("root", [row("first"), row("second")]), row("sibling")],
  selectedId: "root",
  canGoUp: true,
};

function renderTree(onClose = vi.fn()) {
  render(() => (
    <TreePanel
      model={model}
      expandedIds={new Set(["root"])}
      onToggle={vi.fn()}
      onOpen={vi.fn()}
      onHover={vi.fn()}
      onGoUp={vi.fn()}
      onClose={onClose}
    />
  ));
  return { tree: screen.getByRole("tree"), onClose };
}

describe("TreePanel accessibility", () => {
  test("reports flattened hierarchy metadata and follows the active row", () => {
    const { tree } = renderTree();
    const items = screen.getAllByRole("treeitem");

    expect(items[0]!.getAttribute("aria-level")).toBe("1");
    expect(items[0]!.getAttribute("aria-posinset")).toBe("1");
    expect(items[0]!.getAttribute("aria-setsize")).toBe("2");
    expect(items[1]!.getAttribute("aria-level")).toBe("2");
    expect(items[1]!.getAttribute("aria-posinset")).toBe("1");
    expect(items[1]!.getAttribute("aria-setsize")).toBe("2");
    expect(items[0]!.getAttribute("aria-selected")).toBe("true");

    fireEvent.keyDown(tree, { key: "ArrowDown" });

    expect(items[0]!.getAttribute("aria-selected")).toBe("false");
    expect(items[1]!.getAttribute("aria-selected")).toBe("true");
    expect(tree.getAttribute("aria-activedescendant")).toBe(items[1]!.id);
  });

  test("keeps focus inside the modal overlay and closes from Escape", () => {
    const { tree, onClose } = renderTree();
    tree.focus();

    fireEvent.keyDown(tree, { key: "Tab" });
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Close tree" })
    );

    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
