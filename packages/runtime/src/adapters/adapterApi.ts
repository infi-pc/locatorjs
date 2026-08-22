import { LabelData } from "../types/LabelData";
import { TreeNode } from "../types/TreeNode";
import { LinkProps, SimpleDOMRect } from "../types/types";

export type ElementInfo = {
  box: SimpleDOMRect;
  label: string;
  link: LinkProps | null;
};

export type FullElementInfo = {
  thisElement: ElementInfo;
  htmlElement: HTMLElement;
  parentElements: ElementInfo[];
  componentBox: SimpleDOMRect;
  componentsLabels: LabelData[];
};

export type TreeState = {
  root: TreeNode;
  originalNode: TreeNode;
  expandedIds: Set<string>;
  highlightedId: string;
};

export type ParentPathItem = {
  /** Element tag or component name at this location. */
  title: string;
  link: LinkProps | null;
  /**
   * Component whose JSX created `title`, when the adapter can tell. Lets the
   * parents menu read "NestingTest2 · <NestingTest3>" instead of five
   * indistinguishable rows.
   */
  component?: string;
  /**
   * `call-site` points at the JSX that created the node; `declaration` points
   * at where the component itself is defined.
   */
  kind?: "call-site" | "declaration";
};

export interface AdapterObject {
  getElementInfo(element: HTMLElement): FullElementInfo | null;
  getTree?(includeElement: HTMLElement): TreeState | null;
  getParentsPaths(element: HTMLElement): ParentPathItem[];
}
