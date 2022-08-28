import { SimpleDOMRect, Source } from "./types";

export interface TreeNode {
  type: "component" | "element";
  name: string;
  uniqueId: string;
  getBox(): SimpleDOMRect | null;
  getParent(): TreeNode | null;
  getChildren(): TreeNode[];
  getSource(): Source | null;
}

export type TreeNodeComponent = TreeNode;

export interface TreeNodeElement extends TreeNode {
  getElement(): Element | Text;
}
