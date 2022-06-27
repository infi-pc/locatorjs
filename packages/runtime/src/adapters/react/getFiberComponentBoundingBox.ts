import { getFiberBoundingBox } from "./getFiberBoundingBox";
import { Fiber } from "@locator/shared";
import { getAllFiberChildren } from "../../getAllFiberChildren";
import { mergeRects } from "../../mergeRects";

export function getFiberComponentBoundingBox(fiber: Fiber) {
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
