import { Fiber } from "@locator/shared";
import { getBoundingRect } from "../../getBoundingRect";
import { getComposedBoundingBox } from "../../getComposedBoundingBox";
import { getUsableName } from "../../getUsableName";
import { SimpleNode } from "../../Runtime";
import { getAllFiberChildren } from "../../getAllFiberChildren";

export function fiberToSimple(fiber: Fiber): SimpleNode {
  const children = getAllFiberChildren(fiber);

  const simpleChildren = children.map((child) => {
    return fiberToSimple(child);
  });
  const element =
    fiber.stateNode instanceof Element || fiber.stateNode instanceof Text
      ? fiber.stateNode
      : fiber.stateNode?.containerInfo;

  if (element) {
    const box = getBoundingRect(element);
    return {
      type: "element",
      element: element,
      fiber: fiber,
      name: getUsableName(fiber),
      box: box || getComposedBoundingBox(simpleChildren),
      children: simpleChildren,
    };
  } else {
    return {
      type: "component",
      fiber: fiber,
      name: getUsableName(fiber),
      box: getComposedBoundingBox(simpleChildren),
      children: simpleChildren,
    };
  }
}
