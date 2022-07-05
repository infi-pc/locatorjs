import { findDebugSource } from "./findDebugSource";
import { findFiberByHtmlElement } from "./findFiberByHtmlElement";
import { getFiberLabel } from "./getFiberLabel";
import { getAllWrappingParents } from "./getAllWrappingParents";
import { deduplicateLabels } from "../../deduplicateLabels";
import { LabelData } from "../../LabelData";
import { getFiberOwnBoundingBox } from "./getFiberOwnBoundingBox";
import { getAllParentsElementsAndRootComponent } from "./getAllParentsElementsAndRootComponent";
import { SimpleDOMRect } from "../../types";

export type ElementInfo = {
  box: SimpleDOMRect;
  label: string;
  link: string;
};

export type FullElementInfo = {
  thisElement: ElementInfo;
  htmlElement: HTMLElement;
  parentElements: ElementInfo[];
  componentBox: SimpleDOMRect;
  componentsLabels: LabelData[];
};

export function getElementInfo(found: HTMLElement): FullElementInfo | null {
  // Instead of labels, return this element, parent elements leading to closest component, its component labels, all wrapping components labels.
  let labels: LabelData[] = [];

  const fiber = findFiberByHtmlElement(found, false);
  if (fiber) {
    console.log("FOUND FIBER:!!!", fiber);

    debugger;

    const { component, componentBox, parentElements } =
      getAllParentsElementsAndRootComponent(fiber);

    console.log("FOUND COMPONENT:!!!", component);
    console.log("FOUND COMPONENT BOX:!!!", componentBox);

    const allPotentialComponentFibers = getAllWrappingParents(component);

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

    const thisLabel = getFiberLabel(fiber, findDebugSource(fiber)?.source);
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
