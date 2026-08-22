/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Source } from "@locator/shared";
import { getReferenceId } from "../functions/getReferenceId";
import nonNullable from "../functions/nonNullable";
import { TreeNode, TreeNodeComponent } from "../types/TreeNode";
import { SimpleDOMRect } from "../types/types";
import { getParentElementAcrossShadow } from "../functions/domTraversal";

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
  getChildren(): TreeNode[] {
    const children = Array.from(this.element.children);
    return children
      .map((child) => {
        if (child instanceof HTMLElement) {
          // @ts-ignore
          return new this.constructor(child);
        } else {
          return null;
        }
      })
      .filter(nonNullable);
  }
  getParent(): TreeNode | null {
    const parent = getParentElementAcrossShadow(this.element);
    if (parent) {
      // @ts-ignore
      return new this.constructor(parent);
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
