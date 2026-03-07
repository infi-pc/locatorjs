import { Fiber, Renderer } from "@locator/shared";
import { findDebugSource } from "./findDebugSource";

/**
 * Get Fiber directly from DOM element (React 17+, including React 19)
 * React stores __reactFiber$xxx property on DOM elements
 */
function getFiberFromElement(element: HTMLElement): Fiber | null {
  const keys = Object.keys(element);
  // React 17+ uses __reactFiber$ prefix
  const fiberKey = keys.find((key) => key.startsWith("__reactFiber$"));
  if (fiberKey) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (element as any)[fiberKey] as Fiber;
  }
  // React 16 uses __reactInternalInstance$ prefix
  const internalKey = keys.find((key) =>
    key.startsWith("__reactInternalInstance$")
  );
  if (internalKey) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (element as any)[internalKey] as Fiber;
  }
  return null;
}

export function findFiberByHtmlElement(
  target: HTMLElement,
  shouldHaveDebugSource: boolean
): Fiber | null {
  const renderers = window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers;
  const renderersValues = renderers?.values();

  // Prefer renderer.findFiberByHostInstance (React 18 and earlier)
  if (renderersValues) {
    for (const renderer of Array.from(renderersValues) as Renderer[]) {
      if (renderer.findFiberByHostInstance) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const found = renderer.findFiberByHostInstance(target as any);
        if (found) {
          if (shouldHaveDebugSource) {
            return findDebugSource(found)?.fiber || null;
          } else {
            return found;
          }
        }
      }
    }
  }

  // Fallback: get Fiber directly from DOM (React 19+ or DevTools not installed)
  const fiber = getFiberFromElement(target);
  if (fiber) {
    if (shouldHaveDebugSource) {
      return findDebugSource(fiber)?.fiber || null;
    } else {
      return fiber;
    }
  }

  return null;
}
