import { findDebugSource } from "../findDebugSource";
import { findFiberByHtmlElement } from "./react/findFiberByHtmlElement";
import { getFiberLabel } from "../getFiberLabel";
import nonNullable from "../nonNullable";
import { getDataForDataId } from "../runtimeStore";
import { getAllParentsWithTheSameBoundingBox } from "../getAllParentsWithTheSameBoundingBox";
import { deduplicateLabels } from "../deduplicateLabels";
import { LabelData } from "../LabelData";
import { getFiberBoundingBox } from "./react/getFiberBoundingBox";

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
    const allPotentialFibers = getAllParentsWithTheSameBoundingBox(fiber);

    // This handles a common case when the component root is basically the comopnent itself, so I want to go to usage of the component
    if (fiber.return && fiber.return === fiber._debugOwner) {
      allPotentialFibers.push(fiber.return);
    }

    allPotentialFibers.forEach((fiber) => {
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
      parentElements: [],
      componentBox: getFiberBoundingBox(fiber) || found.getBoundingClientRect(),
      componentsLabels: deduplicateLabels(labels),
    };
  }

  return null;
}
