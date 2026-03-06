import { Fiber, Renderer } from "@locator/shared";
import { findDebugSource } from "./findDebugSource";

/**
 * 从 DOM 元素直接获取 Fiber（适用于 React 17+，包括 React 19）
 * React 在 DOM 元素上存储了 __reactFiber$xxx 属性
 */
function getFiberFromElement(element: HTMLElement): Fiber | null {
  const keys = Object.keys(element);
  // React 17+ 使用 __reactFiber$ 前缀
  const fiberKey = keys.find((key) => key.startsWith("__reactFiber$"));
  if (fiberKey) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (element as any)[fiberKey] as Fiber;
  }
  // React 16 使用 __reactInternalInstance$ 前缀
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

  // 优先使用 renderer.findFiberByHostInstance（React 18 及更早版本）
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

  // 回退方案：直接从 DOM 元素获取 Fiber（React 19+ 或 DevTools 未安装时）
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
