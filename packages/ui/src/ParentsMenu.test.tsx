import { cleanup, fireEvent, render, screen } from "@solidjs/testing-library";
import { afterEach, describe, expect, test, vi } from "vitest";
import { ParentsMenu } from "./ParentsMenu";
import type { ParentRow } from "./treeModel";

afterEach(cleanup);

const rows: ParentRow[] = ["Inner", "Middle", "Outer"].map((tag, index) => ({
  id: `row-${index}`,
  tag,
  detail: `App.tsx:${index}:1`,
  kind: "call-site",
  source: {
    filePath: "/repo/src/App.tsx",
    line: index,
    column: 1,
    projectPath: "/repo",
  },
}));

function renderMenu() {
  const onHover = vi.fn();
  render(() => (
    <ParentsMenu
      rows={rows}
      onOpen={vi.fn()}
      onHover={onHover}
      onClose={vi.fn()}
    />
  ));
  return { menu: screen.getByRole("menu"), onHover };
}

describe("ParentsMenu keyboard focus", () => {
  test("ArrowUp from the unfocused state lands on the last row", () => {
    // `focused` starts at -1, and `(-1 - 1 + 3) % 3` is 1: the first ArrowUp
    // highlighted the middle row and reported that wrong row to onHover.
    const { menu, onHover } = renderMenu();

    fireEvent.keyDown(menu, { key: "ArrowUp" });

    expect(onHover).toHaveBeenCalledWith("row-2");
  });

  test("ArrowDown from the unfocused state lands on the first row", () => {
    const { menu, onHover } = renderMenu();

    fireEvent.keyDown(menu, { key: "ArrowDown" });

    expect(onHover).toHaveBeenCalledWith("row-0");
  });

  test("wraps in both directions once focused", () => {
    const { menu, onHover } = renderMenu();

    fireEvent.keyDown(menu, { key: "ArrowUp" }); // row-2
    fireEvent.keyDown(menu, { key: "ArrowDown" }); // wraps to row-0
    fireEvent.keyDown(menu, { key: "ArrowUp" }); // wraps back to row-2

    expect(onHover.mock.calls.map(([id]) => id)).toEqual([
      "row-2",
      "row-0",
      "row-2",
    ]);
  });
});
