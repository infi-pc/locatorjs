import { SimpleDOMRect, Source } from "./types";

interface TreeNode {
  name: string;
  uniqueId: string;
  getBox(): SimpleDOMRect | null;
  getParent(): TreeNode | null;
  getChildren(): TreeNode[];
  getSource(): Source | null;
}

export class TreeNodeComponent implements TreeNode {
  name: string;
  uniqueId: string;
  constructor(name: string, uniqueId: string) {
    this.name = name;
    this.uniqueId = uniqueId;
  }
  getBox(): SimpleDOMRect | null {
    return null;
  }
  getChildren(): TreeNode[] {
    return [];
  }
  getParent(): TreeNode {
    throw new Error("Method not implemented.");
  }
  getSource(): Source | null {
    throw new Error("Method not implemented.");
  }
}

export class TreeNodeElement implements TreeNode {
  name: string;
  uniqueId: string;
  constructor(name: string, uniqueId: string) {
    this.name = name;
    this.uniqueId = uniqueId;
  }
  getBox(): SimpleDOMRect | null {
    return null;
  }
  getElement(): Element | Text {
    throw new Error("Method not implemented.");
  }
  getChildren(): TreeNode[] {
    return [];
  }
  getParent(): TreeNode {
    throw new Error("Method not implemented.");
  }
  getSource(): Source | null {
    throw new Error("Method not implemented.");
  }
}
