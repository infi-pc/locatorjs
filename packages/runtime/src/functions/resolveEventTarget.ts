import { getShadowRootOf } from "./shadowRoots";

/**
 * The element the user actually pointed at, looking through shadow boundaries.
 *
 * `event.target` is retargeted to the shadow host for anything inside a shadow
 * tree, so a single document-level listener would only ever see hosts.
 * `composedPath()[0]` gives the real element for open roots. Closed roots
 * truncate the composed path, so from there we drill down with
 * `ShadowRoot.elementFromPoint`, which does cross the boundary.
 */
export function resolveEventTarget(event: MouseEvent): HTMLElement | null {
  const path = event.composedPath();
  let current: EventTarget | null = path[0] ?? event.target;

  while (current instanceof Element) {
    const shadowRoot = getShadowRootOf(current);
    if (!shadowRoot || !containsPoint(current, event.clientX, event.clientY)) {
      break;
    }
    const inner = shadowRoot.elementFromPoint(event.clientX, event.clientY);
    // `elementFromPoint` retargets, so a point outside the host comes back as
    // an element from an outer tree. Only a genuine child of this root counts.
    if (!inner || inner === current || inner.getRootNode() !== shadowRoot) {
      break;
    }
    current = inner;
  }

  return current instanceof HTMLElement ? current : null;
}

function containsPoint(element: Element, x: number, y: number) {
  const rect = element.getBoundingClientRect();
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}
