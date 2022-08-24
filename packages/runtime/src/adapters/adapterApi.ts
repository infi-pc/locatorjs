import { LabelData } from "../types/LabelData";
import { TreeNode } from "../types/TreeNode";
import { LinkProps, SimpleDOMRect, SimpleNode } from "../types/types";

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

export type GetTreeResult = {
  root: TreeNode;
  selectedIds: Set<string>;
};

export interface AdapterObject {
  getElementInfo(element: HTMLElement): FullElementInfo | null;
  getTree?(includeElement: HTMLElement): GetTreeResult | null;
}
