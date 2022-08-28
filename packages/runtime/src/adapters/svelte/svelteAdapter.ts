import { Source } from "@locator/shared";
import { getReferenceId } from "../../functions/getReferenceId";
import nonNullable from "../../functions/nonNullable";
import { TreeNode } from "../../types/TreeNode";
import { SimpleDOMRect } from "../../types/types";
import { AdapterObject, FullElementInfo, TreeState } from "../adapterApi";

type SvelteLoc = {
  char: number;
  column: number;
  file: string;
  line: number;
};

type SvelteElement = HTMLElement & { __svelte_meta?: { loc: SvelteLoc } };

export function getElementInfo(found: SvelteElement): FullElementInfo | null {
  if (found.__svelte_meta) {
    const { loc } = found.__svelte_meta;
    return {
      thisElement: {
        box: found.getBoundingClientRect(),
        label: found.nodeName.toLowerCase(),
        link: {
          column: loc.column + 1,
          line: loc.line + 1,
          filePath: loc.file,
          projectPath: "",
        },
      },
      htmlElement: found,
      parentElements: [],
      componentBox: found.getBoundingClientRect(),
      componentsLabels: [],
    };
  }
  return null;
}

export class JSXTreeNodeElement implements TreeNode {
  element: SvelteElement;
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
          return new JSXTreeNodeElement(child);
        } else {
          return null;
        }
      })
      .filter(nonNullable);
  }
  getParent(): TreeNode | null {
    if (this.element.parentElement) {
      return new JSXTreeNodeElement(this.element.parentElement);
    } else {
      return null;
    }
  }
  getSource(): Source | null {
    if (this.element.__svelte_meta) {
      const { loc } = this.element.__svelte_meta;
      return {
        fileName: loc.file,
        lineNumber: loc.line + 1,
        columnNumber: loc.column + 1,
      };
    }
    return null;
  }
}

function getTree(element: HTMLElement): TreeState | null {
  let root: TreeNode = new JSXTreeNodeElement(element);

  const allIds = new Set<string>();
  let current: TreeNode | null = root;

  const highlightedId = root.uniqueId;
  allIds.add(current.uniqueId);
  let limit = 3;
  while (current && limit > 0) {
    limit--;
    current = current.getParent();
    if (current) {
      allIds.add(current.uniqueId);
      root = current;
    }
  }

  return {
    root: root,
    expandedIds: allIds,
    highlightedId: highlightedId,
  };
}

const svelteAdapter: AdapterObject = {
  getElementInfo,
  getTree,
};

export default svelteAdapter;
