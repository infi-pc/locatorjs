import { findDebugSource, findDebugSourceAsync } from "./findDebugSource";
import { findFiberByHtmlElement } from "./findFiberByHtmlElement";
import { getFiberLabel } from "./getFiberLabel";
import { getAllWrappingParents } from "./getAllWrappingParents";
import { deduplicateLabels } from "../../functions/deduplicateLabels";
import { LabelData } from "../../types/LabelData";
import { getFiberOwnBoundingBox } from "./getFiberOwnBoundingBox";
import { getAllParentsElementsAndRootComponent } from "./getAllParentsElementsAndRootComponent";
import { isStyledElement } from "./isStyled";
import {
  AdapterObject,
  FullElementInfo,
  ParentPathItem,
  TreeState,
} from "../adapterApi";
import { Fiber, Source } from "@locator/shared";
import { TreeNode, TreeNodeComponent } from "../../types/TreeNode";
import { goUpByTheTree } from "../goUpByTheTree";
import { HtmlElementTreeNode } from "../HtmlElementTreeNode";

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

export class ReactTreeNodeElement extends HtmlElementTreeNode {
  getSource(): Source | null {
    const fiber = findFiberByHtmlElement(this.element, false);
    if (fiber) {
      const result = findDebugSource(fiber);
      if (result) {
        return result.source;
      }
    }
    return null;
  }
  getComponent(): TreeNodeComponent | null {
    const fiber = findFiberByHtmlElement(this.element, false);
    const componentFiber = fiber?._debugOwner;

    if (componentFiber) {
      const fiberLabel = getFiberLabel(
        componentFiber,
        findDebugSource(componentFiber)?.source
      );

      return {
        label: fiberLabel.label,
        callLink:
          (fiberLabel.link && {
            fileName: fiberLabel.link.filePath,
            lineNumber: fiberLabel.link.line,
            columnNumber: fiberLabel.link.column,
            projectPath: fiberLabel.link.projectPath,
          }) ||
          undefined,
      };
    }
    return null;
  }
}

function getTree(element: HTMLElement): TreeState | null {
  const originalRoot: TreeNode = new ReactTreeNodeElement(element);

  return goUpByTheTree(originalRoot);
}

function fiberToPathItem(fiber: Fiber): ParentPathItem {
  const label = getFiberLabel(fiber, findDebugSource(fiber)?.source);

  return {
    title: label.label,
    link: label.link,
  };
}

function getParentsPaths(element: HTMLElement) {
  const fiber = findFiberByHtmlElement(element, false);
  if (fiber) {
    const pathItems: ParentPathItem[] = [];
    let currentFiber = fiber;
    pathItems.push(fiberToPathItem(currentFiber));

    while (currentFiber._debugOwner) {
      currentFiber = currentFiber._debugOwner;
      pathItems.push(fiberToPathItem(currentFiber));
    }

    return pathItems;
  }
  return [];
}

/**
 * 异步版本的 getElementInfo
 * 当同步方式无法获取 source 时，尝试通过 source-map 解析
 */
export async function getElementInfoAsync(
  found: HTMLElement
): Promise<FullElementInfo | null> {
  const labels: LabelData[] = [];

  const fiber = findFiberByHtmlElement(found, false);
  if (fiber) {
    const { component, componentBox, parentElements } =
      getAllParentsElementsAndRootComponent(fiber);

    const allPotentialComponentFibers = getAllWrappingParents(component);

    // 使用异步方式获取 source
    for (const f of allPotentialComponentFibers) {
      const fiberWithSource = await findDebugSourceAsync(f);
      if (fiberWithSource) {
        const label = getFiberLabel(
          fiberWithSource.fiber,
          fiberWithSource.source
        );
        labels.push(label);
      }
    }

    // 获取当前元素的 source（异步）
    const currentSource = await findDebugSourceAsync(fiber);
    const thisLabel = getFiberLabel(fiber, currentSource?.source);

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

const reactAdapter: AdapterObject = {
  getElementInfo,
  getTree,
  getParentsPaths,
};

export default reactAdapter;
