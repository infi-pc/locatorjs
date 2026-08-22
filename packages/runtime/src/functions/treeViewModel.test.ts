import { describe, expect, test } from "vitest";
import type { ParentPathItem, TreeState } from "../adapters/adapterApi";
import type { TreeNode, TreeNodeComponent } from "../types/TreeNode";
import type { Source } from "../types/types";
import {
  buildParentRows,
  buildTreeViewModel,
  idsOnPathToRoot,
  sourceRefToLinkProps,
} from "./treeViewModel";

function source(fileName: string, lineNumber: number, column = 0): Source {
  return { fileName, lineNumber, columnNumber: column };
}

type NodeSpec = {
  name: string;
  id: string;
  source?: Source | null;
  component?: TreeNodeComponent | null;
  children?: NodeSpec[];
  /** Adapters that do not model components throw instead of returning null. */
  throwsOnComponent?: boolean;
};

function node(spec: NodeSpec, parent: TreeNode | null = null): TreeNode {
  const built: TreeNode = {
    type: "element",
    name: spec.name,
    uniqueId: spec.id,
    getBox: () => null,
    getParent: () => parent,
    getChildren: () => children,
    getSource: () => spec.source ?? null,
    getComponent: () => {
      if (spec.throwsOnComponent) throw new Error("no component model");
      return spec.component ?? null;
    },
  };
  const children = (spec.children ?? []).map((child) => node(child, built));
  return built;
}

function state(root: TreeNode, expanded: string[] = []): TreeState {
  return {
    root,
    originalNode: root,
    expandedIds: new Set(expanded),
    highlightedId: "",
  };
}

const nesting: TreeNodeComponent = {
  label: "NestingTest",
  callLink: source("/repo/src/App.tsx", 31, 7),
};

describe("buildTreeViewModel", () => {
  test("maps an element row with its own source and detail", () => {
    const tree = node({
      name: "div",
      id: "1",
      source: source("/repo/src/App.tsx", 24, 5),
    });
    const model = buildTreeViewModel(state(tree), new Set());

    expect(model.rows).toHaveLength(1);
    expect(model.rows[0]).toMatchObject({
      id: "1",
      kind: "element",
      label: "div",
      detail: "App.tsx:24",
      hasChildren: false,
      source: { filePath: "/repo/src/App.tsx", line: 24, column: 5 },
    });
  });

  test("a row without a source is inert rather than falsely clickable", () => {
    const tree = node({ name: "svg", id: "1", source: null });
    const [row] = buildTreeViewModel(state(tree), new Set()).rows;

    expect(row!.source).toBeNull();
    expect(row!.detail).toBeUndefined();
  });

  test("only maps children of expanded rows, but still reports they exist", () => {
    const tree = node({
      name: "div",
      id: "1",
      children: [{ name: "span", id: "2" }],
    });

    const collapsed = buildTreeViewModel(state(tree), new Set()).rows[0]!;
    expect(collapsed.hasChildren).toBe(true);
    expect(collapsed.children).toEqual([]);

    const expanded = buildTreeViewModel(state(tree), new Set(["1"])).rows[0]!;
    expect(expanded.children.map((row) => row.id)).toEqual(["2"]);
  });

  test("lifts a component boundary into its own row above the element", () => {
    const tree = node({
      name: "section",
      id: "1",
      component: nesting,
      source: source("/repo/src/NestingTest.tsx", 16, 5),
    });
    const [row] = buildTreeViewModel(state(tree), new Set()).rows;

    expect(row).toMatchObject({
      id: "component:1",
      kind: "component",
      label: "NestingTest",
      detail: "App.tsx:31",
    });
    // The element it renders hangs underneath, keeping its own source.
    expect(row!.children).toHaveLength(1);
    expect(row!.children[0]).toMatchObject({
      id: "1",
      kind: "element",
      label: "section",
      detail: "NestingTest.tsx:16",
    });
  });

  test("does not repeat a component row for every element it renders", () => {
    const tree = node({
      name: "section",
      id: "1",
      component: nesting,
      children: [{ name: "button", id: "2", component: nesting }],
    });
    const [row] = buildTreeViewModel(state(tree), new Set(["1"])).rows;

    expect(row!.kind).toBe("component");
    expect(row!.children[0]!.children.map((child) => child.kind)).toEqual([
      "element",
    ]);
  });

  test("starts a new component row when the component changes", () => {
    const inner: TreeNodeComponent = {
      label: "Inner",
      callLink: source("/repo/src/NestingTest.tsx", 40, 3),
    };
    const tree = node({
      name: "section",
      id: "1",
      component: nesting,
      children: [{ name: "div", id: "2", component: inner }],
    });
    const [row] = buildTreeViewModel(state(tree), new Set(["1"])).rows;

    expect(row!.children[0]!.children[0]).toMatchObject({
      id: "component:2",
      kind: "component",
      label: "Inner",
    });
  });

  test("falls back to the definition when there is no call site", () => {
    // Adapters driven by the babel plugin only know where a component is
    // defined. Without this fallback every component row would be inert.
    const tree = node({
      name: "section",
      id: "1",
      component: {
        label: "Widget",
        definitionLink: source("/repo/src/Widget.tsx", 3, 1),
      },
    });
    const [row] = buildTreeViewModel(state(tree), new Set()).rows;

    expect(row!.detail).toBe("Widget.tsx:3");
    expect(row!.source).toMatchObject({
      filePath: "/repo/src/Widget.tsx",
      line: 3,
    });
  });

  test("the call site wins when the adapter knows both", () => {
    const tree = node({
      name: "section",
      id: "1",
      component: {
        label: "Widget",
        callLink: source("/repo/src/App.tsx", 20, 5),
        definitionLink: source("/repo/src/Widget.tsx", 3, 1),
      },
    });
    const [row] = buildTreeViewModel(state(tree), new Set()).rows;

    expect(row!.detail).toBe("App.tsx:20");
  });

  test("survives adapters that throw instead of reporting no component", () => {
    const tree = node({ name: "div", id: "1", throwsOnComponent: true });
    expect(() => buildTreeViewModel(state(tree), new Set())).not.toThrow();
    expect(buildTreeViewModel(state(tree), new Set()).rows[0]!.kind).toBe(
      "element"
    );
  });

  test("reports whether a parent exists above the current root", () => {
    const withParent = node({
      name: "div",
      id: "1",
      children: [{ name: "span", id: "2" }],
    });
    expect(buildTreeViewModel(state(withParent), new Set()).canGoUp).toBe(
      false
    );

    const child = withParent.getChildren()[0]!;
    expect(
      buildTreeViewModel(
        { ...state(withParent), root: child, originalNode: child },
        new Set()
      ).canGoUp
    ).toBe(true);
  });
});

describe("idsOnPathToRoot", () => {
  test("names every row that has to be expanded to reveal the target", () => {
    const root = node({
      name: "div",
      id: "1",
      children: [
        { name: "section", id: "2", children: [{ name: "b", id: "3" }] },
      ],
    });
    const deep = root.getChildren()[0]!.getChildren()[0]!;

    expect(idsOnPathToRoot({ ...state(root), originalNode: deep })).toEqual([
      "3",
      "component:3",
      "2",
      "component:2",
      "1",
      "component:1",
    ]);
  });
});

describe("buildParentRows", () => {
  const item = (
    title: string,
    filePath: string,
    line: number,
    column: number,
    extra: Partial<ParentPathItem> = {}
  ): ParentPathItem => ({
    title,
    link: { filePath, projectPath: "/repo", line, column },
    ...extra,
  });

  test("labels a row with the component that renders it", () => {
    const rows = buildParentRows([
      item("button", "/repo/src/NestingTest.tsx", 18, 9, {
        component: "NestingTest",
      }),
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      component: "NestingTest",
      tag: "button",
      detail: "NestingTest.tsx:18:9",
      kind: "call-site",
    });
  });

  test("drops entries the adapter could not resolve to a source", () => {
    expect(
      buildParentRows([
        { title: "div", link: null },
        item("span", "/repo/src/App.tsx", 4, 1),
      ]).map((row) => row.tag)
    ).toEqual(["span"]);
  });

  test("collapses entries pointing at the same place", () => {
    // The old menu showed five indistinguishable `div / NestingTest.tsx` rows.
    const rows = buildParentRows([
      item("div", "/repo/src/NestingTest.tsx", 16, 5),
      item("div", "/repo/src/NestingTest.tsx", 16, 5),
      item("div", "/repo/src/NestingTest.tsx", 18, 5),
    ]);

    expect(rows.map((row) => row.detail)).toEqual([
      "NestingTest.tsx:16:5",
      "NestingTest.tsx:18:5",
    ]);
  });

  test("every row carries a line and column so two in one file differ", () => {
    const rows = buildParentRows([
      item("div", "/repo/src/App.tsx", 10, 3),
      item("div", "/repo/src/App.tsx", 20, 3),
    ]);

    expect(new Set(rows.map((row) => row.detail)).size).toBe(2);
  });

  test("treats a capitalised title with no component as a declaration", () => {
    const rows = buildParentRows([item("App", "/repo/src/App.tsx", 8, 1)]);

    expect(rows[0]).toMatchObject({
      component: "App",
      tag: undefined,
      kind: "declaration",
    });
  });

  test("an explicit kind from the adapter wins over the name heuristic", () => {
    const rows = buildParentRows([
      item("App", "/repo/src/main.tsx", 12, 3, { kind: "call-site" }),
    ]);

    expect(rows[0]!.kind).toBe("call-site");
  });

  test("keeps the ids unique even for the same location", () => {
    const rows = buildParentRows([
      item("div", "/repo/src/App.tsx", 1, 1),
      item("span", "/repo/src/App.tsx", 2, 1),
    ]);

    expect(new Set(rows.map((row) => row.id)).size).toBe(2);
  });
});

describe("sourceRefToLinkProps", () => {
  test("fills in the project path the link builder expects", () => {
    expect(
      sourceRefToLinkProps({ filePath: "/a.tsx", line: 2, column: 3 })
    ).toEqual({ filePath: "/a.tsx", projectPath: "", line: 2, column: 3 });
    expect(
      sourceRefToLinkProps({
        filePath: "/a.tsx",
        line: 2,
        column: 3,
        projectPath: "/repo",
      })
    ).toMatchObject({ projectPath: "/repo" });
  });
});
