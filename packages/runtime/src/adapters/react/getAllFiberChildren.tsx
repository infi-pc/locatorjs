import { Fiber } from "@amirrezadev1378/shared";

export function getAllFiberChildren(fiber: Fiber) {
  const allChildren: Fiber[] = [];
  let child = fiber.child;
  while (child) {
    allChildren.push(child);
    child = child.sibling;
  }
  return allChildren;
}
