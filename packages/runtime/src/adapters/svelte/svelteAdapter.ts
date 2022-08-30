import { Source } from "@locator/shared";
import { TreeNode, TreeNodeComponent } from "../../types/TreeNode";
import { AdapterObject, FullElementInfo, TreeState } from "../adapterApi";
import { goUpByTheTree } from "../goUpByTheTree";
import { HtmlElementTreeNode } from "../HtmlElementTreeNode";

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

export class SvelteTreeNodeElement extends HtmlElementTreeNode {
  getSource(): Source | null {
    const element = this.element as SvelteElement;
    if (element.__svelte_meta) {
      const { loc } = element.__svelte_meta;
      return {
        fileName: loc.file,
        lineNumber: loc.line + 1,
        columnNumber: loc.column + 1,
      };
    }
    return null;
  }
  getComponent(): TreeNodeComponent | null {
    return null;
  }
}

function getTree(element: HTMLElement): TreeState | null {
  const originalRoot: TreeNode = new SvelteTreeNodeElement(element);

  return goUpByTheTree(originalRoot);
}

const svelteAdapter: AdapterObject = {
  getElementInfo,
  getTree,
};

export default svelteAdapter;
