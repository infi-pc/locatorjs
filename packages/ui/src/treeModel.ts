/**
 * View models for the tree panel and the parents menu.
 *
 * The UI components consume only these types — never framework adapters or
 * live DOM nodes. Adapters keep answering "which DOM element, which fiber",
 * and the runtime maps that into rows here. Swapping which tree we show (DOM
 * children today, owner or render tree later) is then a change of mapper, not
 * a change of UI.
 */

import type { SourcePathKind } from "@locator/shared";

export type TreeSourceRef = {
  filePath: string;
  line: number;
  column: number;
  projectPath?: string;
  pathKind?: SourcePathKind;
};

export type TreeRowKind = "element" | "component";

export type TreeRow = {
  /** Stable within one panel session; used for expansion and highlighting. */
  id: string;
  kind: TreeRowKind;
  /** `div` for elements, `NestingTest` for components. */
  label: string;
  /** Where the row opens. A row without a source is inert. */
  source: TreeSourceRef | null;
  /** Muted right-hand text, already shortened for display. */
  detail?: string;
  /** Children exist, whether or not they are currently mapped. */
  hasChildren: boolean;
  /** Mapped children. Empty while the row is collapsed. */
  children: TreeRow[];
};

export type TreeViewModel = {
  rows: TreeRow[];
  /** Row the panel was opened from. */
  selectedId?: string;
  /** A parent exists above the current roots. */
  canGoUp: boolean;
};

export type ParentRowKind = "call-site" | "declaration";

export type ParentRow = {
  id: string;
  /** Component that renders this location, when known. */
  component?: string;
  /** Element tag at this location, when known. */
  tag?: string;
  /** Muted secondary text, already shortened for display. */
  detail?: string;
  kind: ParentRowKind;
  source: TreeSourceRef | null;
};

/** Depth-first list of the rows a user can actually see and focus. */
export function visibleTreeRows(
  rows: TreeRow[],
  expandedIds: ReadonlySet<string>,
  depth = 0
): { row: TreeRow; depth: number; posInSet: number; setSize: number }[] {
  return rows.flatMap((row, index) => [
    { row, depth, posInSet: index + 1, setSize: rows.length },
    ...(expandedIds.has(row.id)
      ? visibleTreeRows(row.children, expandedIds, depth + 1)
      : []),
  ]);
}

export function formatSourceRef(source: TreeSourceRef | null): string {
  if (!source) return "";
  return `${source.filePath}:${source.line}:${source.column}`;
}
