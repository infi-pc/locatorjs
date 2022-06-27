import { Fiber } from "@locator/shared";
import { getFiberBoundingBox } from "./adapters/react/getFiberBoundingBox";

export function getAllParentsWithTheSameBoundingBox(fiber: Fiber): Fiber[] {
  const parents: Fiber[] = [fiber];

  if (fiber.stateNode === null) {
    return parents;
  }

  let currentFiber = fiber;
  while (currentFiber.return) {
    currentFiber = currentFiber.return;
    const fiberBox = getFiberBoundingBox(fiber);
    const currentFiberBox = getFiberBoundingBox(currentFiber);
    if (fiberBox && currentFiberBox) {
      if (
        currentFiberBox.x === fiberBox.x &&
        currentFiberBox.y === fiberBox.y &&
        currentFiberBox.width === fiberBox.width &&
        currentFiberBox.height === fiberBox.height
      ) {
        parents.push(currentFiber);
      } else {
        break;
      }
    }
  }
  return parents;
}
