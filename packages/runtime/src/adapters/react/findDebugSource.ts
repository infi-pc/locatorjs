import { Fiber, Source } from "@locator/shared";
import { resolveSourceFromFiber, getSourceFromCache } from "./clickSourceResolver";
import {
  SourceMethod,
  logSourceFound,
  logSourceStart,
  logSourceComplete,
  isDebugEnabled,
  SourceMethodType,
} from "./debug";

/**
 * 尝试从 Fiber 中获取 source 信息（同步版本）
 * React 19 / Next.js 15+ 可能将 source 存储在不同位置
 * 返回 [source, method] 用于 debug
 */
function getSourceFromFiber(fiber: Fiber): [Source | null, SourceMethodType | null] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fiberAny = fiber as any;

  // 1. 传统方式：直接从 _debugSource 获取
  if (fiber._debugSource) {
    return [fiber._debugSource, SourceMethod.FIBER_DEBUG_SOURCE];
  }

  // 2. React 19+：尝试从 type 或 elementType 获取
  // 从 elementType._source 获取
  if (fiberAny.elementType?._source) {
    return [fiberAny.elementType._source, SourceMethod.ELEMENT_TYPE_SOURCE];
  }

  // 从 type._source 获取
  if (fiberAny.type?._source) {
    return [fiberAny.type._source, SourceMethod.TYPE_SOURCE];
  }

  // 3. Next.js / Turbopack: 尝试从 __debugSource 获取
  if (fiberAny.__debugSource) {
    return [fiberAny.__debugSource, SourceMethod.FIBER_DEBUG_SOURCE_ALT];
  }

  // 4. 尝试从 memoizedProps 中获取 __source（JSX 转换注入）
  if (fiberAny.memoizedProps?.__source) {
    return [fiberAny.memoizedProps.__source, SourceMethod.MEMOIZED_PROPS_SOURCE];
  }

  // 5. 尝试从 pendingProps 中获取 __source
  if (fiberAny.pendingProps?.__source) {
    return [fiberAny.pendingProps.__source, SourceMethod.PENDING_PROPS_SOURCE];
  }

  // 6. 尝试从 _debugInfo 获取（React 19 Server Components）
  if (fiberAny._debugInfo && Array.isArray(fiberAny._debugInfo)) {
    for (const info of fiberAny._debugInfo) {
      if (info.stack) {
        // 解析 stack 获取第一个有效的位置
        const match = info.stack.match(/at\s+\S+\s+\(([^:]+):(\d+):(\d+)\)/);
        if (match) {
          return [{
            fileName: match[1],
            lineNumber: parseInt(match[2], 10),
            columnNumber: parseInt(match[3], 10),
          }, SourceMethod.DEBUG_INFO_STACK];
        }
      }
    }
  }

  // 7. 尝试从 type 的函数名推断（最后手段）
  // 某些情况下可以获取到组件定义的文件信息
  if (typeof fiberAny.type === "function" && fiberAny.type.__componentSource) {
    return [fiberAny.type.__componentSource, SourceMethod.TYPE_COMPONENT_SOURCE];
  }

  return [null, null];
}

/**
 * 同步版本：从 Fiber 查找 debug source
 * 优先使用传统方式，适用于大多数场景
 */
export function findDebugSource(
  fiber: Fiber
): { fiber: Fiber; source: Source } | null {
  const debug = isDebugEnabled();

  if (debug) {
    logSourceStart(fiber);
  }

  let current: Fiber | null = fiber;
  while (current) {
    const [source, method] = getSourceFromFiber(current);
    if (source) {
      if (debug) {
        logSourceFound(method!, current, source, false);
        logSourceComplete(true, method!, source);
      }
      return { fiber: current, source };
    }

    // 尝试从缓存获取（如果之前异步解析过）
    const cached = getSourceFromCache(current);
    if (cached) {
      if (debug) {
        logSourceFound(SourceMethod.CACHE_HIT, current, cached, false);
        logSourceComplete(true, SourceMethod.CACHE_HIT, cached);
      }
      return { fiber: current, source: cached };
    }

    current = current._debugOwner || null;
  }

  if (debug) {
    logSourceComplete(false);
  }

  return null;
}

/**
 * 异步版本：从 Fiber 查找 debug source
 * 当同步方式失败时，尝试通过 source-map 解析
 * 适用于 Next.js 15+ / React 19+ 使用新打包工具的环境
 */
export async function findDebugSourceAsync(
  fiber: Fiber
): Promise<{ fiber: Fiber; source: Source } | null> {
  // 1. 先尝试同步方式
  const syncResult = findDebugSource(fiber);
  if (syncResult) {
    return syncResult;
  }

  const debug = isDebugEnabled();
  if (debug) {
    console.log(
      "%c[LocatorJS] 同步方式未找到，尝试异步解析...",
      "color: #2196F3; font-style: italic"
    );
  }

  // 2. 同步方式失败，尝试异步解析（通过 source-map）
  let current: Fiber | null = fiber;
  while (current) {
    const source = await resolveSourceFromFiber(current);
    if (source) {
      return { fiber: current, source };
    }
    current = current._debugOwner || null;
  }

  if (debug) {
    logSourceComplete(false);
  }

  return null;
}
