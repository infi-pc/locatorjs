import { Fiber } from "@locator/shared";

export function getFiberBoundingBox(fiber: Fiber) {
  if (fiber.stateNode && fiber.stateNode.getBoundingClientRect) {
    return fiber.stateNode.getBoundingClientRect();
  }
  return null;
}
