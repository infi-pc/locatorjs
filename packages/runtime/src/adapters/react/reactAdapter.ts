import { findDebugSource } from "./findDebugSource";
import { findFiberByHtmlElement } from "./findFiberByHtmlElement";
import { getFiberLabel } from "./getFiberLabel";
import { getAllWrappingParents } from "./getAllWrappingParents";
import { deduplicateLabels } from "../../functions/deduplicateLabels";
import { LabelData } from "../../types/LabelData";
import { getFiberOwnBoundingBox } from "./getFiberOwnBoundingBox";
import { getAllParentsElementsAndRootComponent } from "./getAllParentsElementsAndRootComponent";
import { isStyledElement } from "./isStyled";
import { AdapterObject, FullElementInfo, TreeState } from "../adapterApi";
import { Source, FileStorage } from "@locator/shared";
import { getReferenceId } from "../../functions/getReferenceId";
import nonNullable from "../../functions/nonNullable";
import { parseDataId } from "../../functions/parseDataId";
import { TreeNode } from "../../types/TreeNode";
import { SimpleDOMRect } from "../../types/types";
import { getExpressionData } from "../jsx/getExpressionData";

export function getElementInfo(found: HTMLElement): FullElementInfo | null {
  // Instead of labels, return this element, parent elements leading to closest component, its component labels, all wrapping components labels.
  const labels: LabelData[] = [];

  const fiber = findFiberByHtmlElement(found, false);
  if (fiber) {
    const { component, componentBox, parentElements } =
      getAllParentsElementsAndRootComponent(fiber);

    const allPotentialComponentFibers = getAllWrappingParents(component);

    // This handles a common case when the component root is basically the comopnent itself, so I want to go to usage of the component
    // TODO: whaat? why? currently I see that it adds the original styled components which is not necessary.

    // if (fiber.return && fiber.return === fiber._debugOwner) {
    //   allPotentialComponentFibers.unshift(fiber.return);
    // }

    allPotentialComponentFibers.forEach((fiber) => {
      const fiberWithSource = findDebugSource(fiber);
      if (fiberWithSource) {
        const label = getFiberLabel(
          fiberWithSource.fiber,
          fiberWithSource.source
        );
        labels.push(label);
      }
    });

    const thisLabel = getFiberLabel(fiber, findDebugSource(fiber)?.source);

    if (isStyledElement(fiber)) {
      thisLabel.label = `${thisLabel.label} (styled)`;
    }

    return {
      thisElement: {
        box: getFiberOwnBoundingBox(fiber) || found.getBoundingClientRect(),
        ...thisLabel,
      },
      htmlElement: found,
      parentElements: parentElements,
      componentBox,
      componentsLabels: deduplicateLabels(labels),
    };
  }

  return null;
}

export class ReactTreeNodeElement implements TreeNode {
  type: "element" = "element";
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
          return new ReactTreeNodeElement(child);
        } else {
          return null;
        }
      })
      .filter(nonNullable);
  }
  getParent(): TreeNode | null {
    if (this.element.parentElement) {
      return new ReactTreeNodeElement(this.element.parentElement);
    } else {
      return null;
    }
  }
  getSource(): Source | null {
    const dataId = this.element.dataset.locatorjsId;
    const locatorData = window.__LOCATOR_DATA__;
    if (dataId && locatorData) {
      const [fileFullPath] = parseDataId(dataId);
      const fileData: FileStorage | undefined = locatorData[fileFullPath];
      if (fileData) {
        const expData = getExpressionData(this.element, fileData);
        if (expData) {
          return {
            fileName: fileData.filePath,
            columnNumber: (expData.loc.start.column || 0) + 1,
            lineNumber: expData.loc.start.line || 0,
          };
        }
      }
    }
    return null;
  }
}

function getTree(element: HTMLElement): TreeState | null {
  let root: TreeNode = new ReactTreeNodeElement(element);

  const allIds = new Set<string>();
  let current: TreeNode | null = root;

  const highlightedId = root.uniqueId;
  allIds.add(current.uniqueId);
  let limit = 2;
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

const reactAdapter: AdapterObject = {
  getElementInfo,
  getTree,
};

export default reactAdapter;
