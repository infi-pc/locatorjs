import { findFiberByHtmlElement } from "./findFiberByHtmlElement";
import { getParentElementAcrossShadow } from "../../functions/domTraversal";

export function searchDevtoolsRenderersForClosestTarget(
  target: HTMLElement
): HTMLElement | null {
  let closest: HTMLElement | null = target;
  while (closest) {
    if (findFiberByHtmlElement(closest, false)) {
      return closest;
    }
    closest = getParentElementAcrossShadow(closest);
  }

  return null;
}
