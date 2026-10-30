import { Fiber, getReactFiber } from "@locator/shared";
import { getParentElementAcrossShadow } from "../../functions/domTraversal";

/**
 * The fiber for the nearest host node react-dom owns, walking up from the
 * target. This is what react-dom's own `getClosestInstanceFromNode` does: the
 * clicked node may be inside `dangerouslySetInnerHTML` or a third-party widget
 * that React never rendered, and the owning host component is the answer.
 */
export function findFiberByHtmlElement(target: HTMLElement): Fiber | null {
  let node: Element | null = target;
  while (node) {
    const fiber = getReactFiber(node);
    if (fiber) return fiber as unknown as Fiber;
    node = getParentElementAcrossShadow(node);
  }
  return null;
}
