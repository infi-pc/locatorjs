import { getShadowRootOf as getTrackedShadowRoot } from "./shadowRoots";

/**
 * DOM traversal that crosses shadow boundaries.
 *
 * `parentElement` is `null` for the topmost element of a shadow tree, and
 * `closest()` stops at the same place. An element rendered inside a shadow root
 * therefore looks like it has no ancestors at all, which breaks source lookup
 * for anything that has to walk upwards - the annotated ancestor usually lives
 * in the light DOM outside the boundary.
 */

/** The parent element, stepping out through the shadow host when needed. */
export function getParentElementAcrossShadow(
  element: Element
): HTMLElement | null {
  if (element.parentElement) {
    return element.parentElement;
  }
  const root = element.getRootNode();
  if (root instanceof ShadowRoot) {
    return root.host as HTMLElement;
  }
  return null;
}

/**
 * Direct element children in composed traversal order: light DOM first, then
 * the host's own shadow tree. Assigned slot content remains represented by its
 * light-DOM parent and is deliberately not visited twice.
 */
export function getChildElementsAcrossShadow(
  element: HTMLElement
): HTMLElement[] {
  const lightChildren = Array.from(element.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement
  );
  // Imported lazily at module evaluation rather than duplicating the closed
  // root registry in traversal code.
  const shadow = getTrackedShadowRoot(element);
  const shadowChildren = shadow
    ? Array.from(shadow.children).filter(
        (child): child is HTMLElement => child instanceof HTMLElement
      )
    : [];
  return [...lightChildren, ...shadowChildren];
}

/** `closest()` that keeps going once it runs out of light-DOM ancestors. */
export function closestAcrossShadow(
  element: Element,
  selector: string
): HTMLElement | null {
  let current: Element | null = element;
  while (current) {
    const found = current.closest(selector);
    if (found) {
      return found as HTMLElement;
    }
    const root: Node = current.getRootNode();
    current = root instanceof ShadowRoot ? (root.host as Element) : null;
  }
  return null;
}
