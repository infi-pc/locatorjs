import { Fiber } from "@amirrezadev1378/shared";

export function isStyledElement(fiber: Fiber) {
  return !!fiber._debugOwner?.elementType?.styledComponentId;
}
