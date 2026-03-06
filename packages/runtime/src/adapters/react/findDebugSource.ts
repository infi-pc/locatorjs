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
 * Try to get source info from Fiber (synchronous)
 * React 19 / Next.js 15+ may store source in different locations
 * Returns [source, method] for debug logging
 */
function getSourceFromFiber(fiber: Fiber): [Source | null, SourceMethodType | null] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fiberAny = fiber as any;

  // 1. Traditional: get directly from _debugSource
  if (fiber._debugSource) {
    return [fiber._debugSource, SourceMethod.FIBER_DEBUG_SOURCE];
  }

  // 2. React 19+: try from type or elementType
  // Get from elementType._source
  if (fiberAny.elementType?._source) {
    return [fiberAny.elementType._source, SourceMethod.ELEMENT_TYPE_SOURCE];
  }

  // Get from type._source
  if (fiberAny.type?._source) {
    return [fiberAny.type._source, SourceMethod.TYPE_SOURCE];
  }

  // 3. Next.js / Turbopack: try from __debugSource
  if (fiberAny.__debugSource) {
    return [fiberAny.__debugSource, SourceMethod.FIBER_DEBUG_SOURCE_ALT];
  }

  // 4. Try __source from memoizedProps (JSX transform injection)
  if (fiberAny.memoizedProps?.__source) {
    return [fiberAny.memoizedProps.__source, SourceMethod.MEMOIZED_PROPS_SOURCE];
  }

  // 5. Try __source from pendingProps
  if (fiberAny.pendingProps?.__source) {
    return [fiberAny.pendingProps.__source, SourceMethod.PENDING_PROPS_SOURCE];
  }

  // 6. Try from _debugInfo (React 19 Server Components)
  if (fiberAny._debugInfo && Array.isArray(fiberAny._debugInfo)) {
    for (const info of fiberAny._debugInfo) {
      if (info.stack) {
        // Parse stack for first valid position
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

  // 7. Try inferring from type function (last resort)
  // May get component definition file info
  if (typeof fiberAny.type === "function" && fiberAny.type.__componentSource) {
    return [fiberAny.type.__componentSource, SourceMethod.TYPE_COMPONENT_SOURCE];
  }

  return [null, null];
}

/**
 * Synchronous: find debug source from Fiber
 * Prefers traditional methods, suitable for most scenarios
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

    // Try from cache (if previously async-resolved)
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
 * Async: find debug source from Fiber
 * When sync fails, try source-map resolution
 * For Next.js 15+ / React 19+ with new bundlers
 */
export async function findDebugSourceAsync(
  fiber: Fiber
): Promise<{ fiber: Fiber; source: Source } | null> {
  // 1. Try synchronous method first
  const syncResult = findDebugSource(fiber);
  if (syncResult) {
    return syncResult;
  }

  const debug = isDebugEnabled();
  if (debug) {
    console.log(
      "%c[LocatorJS] Sync methods failed, trying async resolution...",
      "color: #2196F3; font-style: italic"
    );
  }

  // 2. Sync failed, try async resolution (via source-map)
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
