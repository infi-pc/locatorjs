import { Source } from "@locator/shared";
import { getReferenceId } from "../functions/getReferenceId";
import { TreeNode, TreeNodeComponent } from "../types/TreeNode";
import { SimpleDOMRect } from "../types/types";
import {
  getChildElementsAcrossShadow,
  getParentElementAcrossShadow,
} from "../functions/domTraversal";

export class HtmlElementTreeNode implements TreeNode {
  type = "element" as const;
  element: HTMLElement;
  name: string;
  uniqueId: string;
  constructor(element: HTMLElement) {
    this.element = element;
    this.name = element.nodeName.toLowerCase();
    this.uniqueId = String(getReferenceId(element));
  }
  getBox(): SimpleDOMRect | null {
    return this.element.getBoundingClientRect();
  }
  getElement(): Element | Text {
    return this.element;
  }
  protected createNode(element: HTMLElement): HtmlElementTreeNode {
    return new HtmlElementTreeNode(element);
  }
  getChildren(): TreeNode[] {
    return getChildElementsAcrossShadow(this.element).map((child) =>
      this.createNode(child)
    );
  }
  getParent(): TreeNode | null {
    const parent = getParentElementAcrossShadow(this.element);
    if (parent) {
      return this.createNode(parent);
    } else {
      return null;
    }
  }
  getSource(): Source | null {
    throw new Error("Method not implemented.");
  }
  getComponent(): TreeNodeComponent | null {
    throw new Error("Method not implemented.");
  }
}
