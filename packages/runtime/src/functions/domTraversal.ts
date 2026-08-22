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
