import { Fiber } from "@locator/shared";

export function getAllWrappingParents(fiber: Fiber): Fiber[] {
  const parents: Fiber[] = [fiber];

  let currentFiber = fiber;
  while (currentFiber.return) {
    currentFiber = currentFiber.return;
    if (
      currentFiber.stateNode &&
      currentFiber.stateNode instanceof HTMLElement
    ) {
      return parents;
    }

    parents.push(currentFiber);
  }
  return parents;
}
