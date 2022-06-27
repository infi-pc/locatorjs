import { findDebugSource } from "../findDebugSource";
import { findFiberByHtmlElement } from "./react/findFiberByHtmlElement";
import { getFiberLabel } from "../getFiberLabel";
import nonNullable from "../nonNullable";
import { getDataForDataId } from "../runtimeStore";
import { getAllParentsWithTheSameBoundingBox } from "../getAllParentsWithTheSameBoundingBox";
import { deduplicateLabels } from "../deduplicateLabels";
import { LabelData } from "../LabelData";
import { getFiberBoundingBox } from "./react/getFiberBoundingBox";
import { Fiber } from "@locator/shared";
import { getUsableName } from "../getUsableName";
import { getAllFiberChildren } from "../getAllFiberChildren";
import { mergeRects } from "../mergeRects";

type ElementInfo = {
  box: DOMRect;
  label: string;
  link: string;
};

export type FullElementInfo = {
  thisElement: ElementInfo;
  parentElements: ElementInfo[];
  componentBox: DOMRect;
  componentsLabels: LabelData[];
};

export function getElementInfo(found: HTMLElement): FullElementInfo | null {
  // Instead of labels, return this element, parent elements leading to closest component, its component labels, all wrapping components labels.
  let labels: LabelData[] = [];

  const fiber = findFiberByHtmlElement(found, false);
  if (fiber) {
    const { component, componentBox, parentElements } =
      getAllParentsElementsAndRootComponent(fiber);

    const allPotentialComponentFibers =
      getAllParentsWithTheSameBoundingBox(component);

    // This handles a common case when the component root is basically the comopnent itself, so I want to go to usage of the component
    if (fiber.return && fiber.return === fiber._debugOwner) {
      allPotentialComponentFibers.push(fiber.return);
    }

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

    // TODO parentElements
    // TODO parentComponents

    const thisLabel = getFiberLabel(fiber);
    return {
      thisElement: {
        box: getFiberBoundingBox(fiber) || found.getBoundingClientRect(),
        ...thisLabel,
      },
      parentElements: parentElements,
      componentBox,
      componentsLabels: deduplicateLabels(labels),
    };
  }

  return null;
}

function getAllParentsElementsAndRootComponent(fiber: Fiber): {
  component: Fiber;
  componentBox: DOMRect;
  parentElements: ElementInfo[];
} {
  console.log("getAllParentsElementsAndRootComponent", fiber);

  const parentElements: ElementInfo[] = [];
  const deepestElement = fiber.stateNode;
  if (!deepestElement || !(deepestElement instanceof HTMLElement)) {
    throw new Error(
      "This functions works only for Fibres with HTMLElement stateNode"
    );
  }
  let componentBox: DOMRect = deepestElement.getBoundingClientRect();

  let currentFiber = fiber;
  while (currentFiber.return) {
    currentFiber = currentFiber.return;
    const currentElement = currentFiber.stateNode;
    if (!currentElement || !(currentElement instanceof HTMLElement)) {
      console.log("When fragment, we should go up", currentFiber);

      return {
        component: currentFiber,
        parentElements,
        componentBox:
          getFiberComponentBoundingBox(currentFiber) || componentBox,
      };
    }

    const usableName = getUsableName(currentFiber);

    componentBox = mergeRects(
      componentBox,
      currentElement.getBoundingClientRect()
    );

    parentElements.push({
      box: currentElement.getBoundingClientRect(),
      label: usableName,
      link: "TODO",
    });
  }
  throw new Error("Could not find root component");
}

function getFiberComponentBoundingBox(fiber: Fiber) {
  const children = getAllFiberChildren(fiber);
  let composedRect: DOMRect | undefined;
  children.forEach((child) => {
    const box = getFiberBoundingBox(child);
    if (!box) {
      return;
    }
    if (box.width <= 0 || box.height <= 0) {
      // ignore zero-sized rects
      return;
    }
    if (composedRect) {
      composedRect = mergeRects(composedRect, box);
    } else {
      composedRect = box;
    }
  });
  return composedRect;
}
