import type { ParentRow, TreeRow, TreeViewModel } from "@locator/ui";
import type { TreeState, ParentPathItem } from "../adapters/adapterApi";
import type { TreeNode, TreeNodeComponent } from "../types/TreeNode";
import type { LinkProps, Source } from "../types/types";
import getUsableFileName from "./getUsableFileName";

/**
 * Maps adapter output into the UI view models.
 *
 * The adapters answer "which DOM element / which fiber"; everything about how
 * a row reads — labels, `file:line`, which rows are inert, where component
 * boundaries sit — is decided here. That keeps the panels free of adapter
 * types and leaves room to map a different tree (owner, render) later without
 * touching the UI.
 */

function toSourceRef(source: Source | null | undefined) {
  if (!source) return null;
  return {
    filePath: source.fileName,
    line: source.lineNumber,
    column: source.columnNumber || 0,
    projectPath: source.projectPath,
  };
}

export function sourceRefToLinkProps(source: {
  filePath: string;
  line: number;
  column: number;
  projectPath?: string;
}): LinkProps {
  return {
    filePath: source.filePath,
    projectPath: source.projectPath || "",
    line: source.line,
    column: source.column,
  };
}

function locationDetail(source: Source | null | undefined) {
  if (!source) return undefined;
  return `${getUsableFileName(source.fileName)}:${source.lineNumber}`;
}

function safeComponent(node: TreeNode): TreeNodeComponent | null {
  try {
    return node.getComponent();
  } catch {
    // Adapters that do not model components throw rather than return null.
    return null;
  }
}

function safeSource(node: TreeNode): Source | null {
  try {
    return node.getSource();
  } catch {
    return null;
  }
}

const COMPONENT_ROW_PREFIX = "component:";

export function componentRowId(nodeId: string) {
  return `${COMPONENT_ROW_PREFIX}${nodeId}`;
}

export function nodeIdFromRowId(rowId: string) {
  return rowId.startsWith(COMPONENT_ROW_PREFIX)
    ? rowId.slice(COMPONENT_ROW_PREFIX.length)
    : rowId;
}

function sameComponent(
  a: TreeNodeComponent | null,
  b: TreeNodeComponent | null
) {
  if (!a || !b) return a === b;
  return (
    a.label === b.label &&
    a.callLink?.fileName === b.callLink?.fileName &&
    a.callLink?.lineNumber === b.callLink?.lineNumber &&
    a.callLink?.columnNumber === b.callLink?.columnNumber
  );
}

function mapNode(
  node: TreeNode,
  expandedIds: ReadonlySet<string>,
  parentComponent: TreeNodeComponent | null
): TreeRow[] {
  const source = safeSource(node);
  const component = safeComponent(node);
  const children = node.getChildren();
  const expanded = expandedIds.has(node.uniqueId);

  const elementRow: TreeRow = {
    id: node.uniqueId,
    kind: "element",
    label: node.name,
    source: toSourceRef(source),
    detail: locationDetail(source),
    hasChildren: children.length > 0,
    children: expanded
      ? children.flatMap((child) => mapNode(child, expandedIds, component))
      : [],
  };

  // A component boundary becomes its own row above the element it renders,
  // instead of the nested bordered box the old panel drew.
  if (component && !sameComponent(component, parentComponent)) {
    // The call site is where you edit the usage, so it wins. Falling back to
    // the definition matters for adapters that only know that much — without
    // it every component row would be inert.
    const componentSource = component.callLink ?? component.definitionLink;
    return [
      {
        id: componentRowId(node.uniqueId),
        kind: "component",
        label: component.label,
        source: toSourceRef(componentSource),
        detail: locationDetail(componentSource),
        hasChildren: true,
        children: [elementRow],
      },
    ];
  }

  return [elementRow];
}

export function buildTreeViewModel(
  state: TreeState,
  expandedIds: ReadonlySet<string>
): TreeViewModel {
  return {
    rows: mapNode(state.root, expandedIds, null),
    selectedId: state.highlightedId,
    canGoUp: Boolean(state.root.getParent()),
  };
}

/**
 * Every id that has to be expanded for the given rows to be reachable, so
 * opening the panel reveals the element the user was hovering.
 */
export function idsOnPathToRoot(state: TreeState): string[] {
  const ids: string[] = [];
  let current: TreeNode | null = state.originalNode;
  while (current) {
    ids.push(current.uniqueId, componentRowId(current.uniqueId));
    current = current.getParent();
  }
  return ids;
}

/** Component names start with a capital; element tags do not. */
function isComponentName(title: string) {
  return /^[A-Z]/.test(title);
}

/**
 * Turns the adapter's parent path into distinguishable rows: rows without
 * their own source are dropped, every remaining row carries `file:line`, and
 * duplicates pointing at the same place collapse.
 */
export function buildParentRows(items: ParentPathItem[]): ParentRow[] {
  const rows: ParentRow[] = [];
  const seen = new Set<string>();

  items.forEach((item, index) => {
    const link = item.link;
    if (!link) return;

    // Deduped on the full path, displayed by its short name. Deduping on the
    // short name collapsed `features/cart/Row.tsx` into `features/list/Row.tsx`
    // and dropped a real ancestor -- and since the Parents icon hides when only
    // one row is left, that ancestor became unreachable.
    const location = `${link.filePath}:${link.line}:${link.column}`;
    if (seen.has(location)) return;
    seen.add(location);

    const detail = `${getUsableFileName(link.filePath)}:${link.line}:${
      link.column
    }`;

    const isComponent = isComponentName(item.title);
    rows.push({
      id: `${index}:${link.filePath}:${link.line}:${link.column}`,
      // `component` is who wrote the JSX; when the adapter cannot tell, fall
      // back to the title itself if it names a component.
      component: item.component ?? (isComponent ? item.title : undefined),
      tag: isComponent && !item.component ? undefined : item.title,
      detail,
      kind: item.kind ?? (isComponent ? "declaration" : "call-site"),
      source: {
        filePath: link.filePath,
        line: link.line,
        column: link.column,
        projectPath: link.projectPath,
      },
    });
  });

  return rows;
}
