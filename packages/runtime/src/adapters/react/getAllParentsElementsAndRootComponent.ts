import { Fiber } from "@locator/shared";
import { getUsableName } from "../../getUsableName";
import { mergeRects } from "../../mergeRects";
import { SimpleDOMRect } from "../../types";
import { getFiberComponentBoundingBox } from "./getFiberComponentBoundingBox";
import { ElementInfo } from "./reactAdapter";

export function getAllParentsElementsAndRootComponent(fiber: Fiber): {
  component: Fiber;
  componentBox: SimpleDOMRect;
  parentElements: ElementInfo[];
} {
  const parentElements: ElementInfo[] = [];
  const deepestElement = fiber.stateNode;
  if (!deepestElement || !(deepestElement instanceof HTMLElement)) {
    throw new Error(
      "This functions works only for Fibres with HTMLElement stateNode"
    );
  }
  let componentBox: SimpleDOMRect = deepestElement.getBoundingClientRect();

  let currentFiber = fiber;
  while (currentFiber._debugOwner || currentFiber.return) {
    currentFiber = currentFiber._debugOwner || currentFiber.return!;
    const currentElement = currentFiber.stateNode;
    if (!currentElement || !(currentElement instanceof HTMLElement)) {
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
