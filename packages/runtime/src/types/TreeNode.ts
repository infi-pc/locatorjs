import { SimpleDOMRect, Source } from "./types";
import type { SourceResolutionContext } from "../adapters/react/sourceMapResolver";

export interface TreeNode {
  type: "component" | "element";
  name: string;
  uniqueId: string;
  getBox(): SimpleDOMRect | null;
  getParent(): TreeNode | null;
  getChildren(): TreeNode[];
  getSource(): Source | null;
  getSourceAsync?(context?: SourceResolutionContext): Promise<Source | null>;
  getComponent(): TreeNodeComponent | null;
  getComponentAsync?(
    context?: SourceResolutionContext
  ): Promise<TreeNodeComponent | null>;
}

export type TreeNodeComponent = {
  label: string;
  callLink?: Source;
  definitionLink?: Source;
};

export interface TreeNodeElement extends TreeNode {
  getElement(): Element | Text;
}
