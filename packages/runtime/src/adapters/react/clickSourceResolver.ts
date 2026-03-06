import { Source, Fiber, RendererInterface } from "@locator/shared";
import { resolveOriginalPosition } from "./sourceMapResolver";
import {
  SourceMethod,
  logSourceFound,
  logSourceComplete,
  logError,
  isDebugEnabled,
} from "./debug";

/**
 * Click-based source resolver
 * For Next.js 15+ / React 19+ environments with new bundlers
 *
 * Strategy:
 * 1. Prefer React DevTools 7.0.1+ rendererInterfaces API
 * 2. Get component type (function) from Fiber
 * 3. Parse function toString() or metadata for compiled location
 * 4. Reverse-lookup original position via source-map
 * 5. Extract source info from jsxDEV calls in Turbopack chunk code
 */

/**
 * Extended DevTools Hook type (compatible with 7.0.1+)
 */
type DevToolsHookWithInterfaces = {
  rendererInterfaces?: Map<number, RendererInterface>;
  renderers?: Map<number, unknown>;
};

// Cache: component type -> source mapping
const componentSourceCache = new WeakMap<object, Source | null>();

// Cache: chunk code to avoid repeated fetches
const chunkCodeCache = new Map<string, string>();

// Cache: component name -> source mapping (for Turbopack)
const componentNameSourceCache = new Map<string, Source | null>();

// Cache: element signature -> source mapping (for native elements)
const elementSignatureSourceCache = new Map<string, Source | null>();

/**
 * Get all chunk codes (with caching)
 */
async function getAllChunkCodes(): Promise<string[]> {
  const scripts = Array.from(
    document.querySelectorAll('script[src*="/_next/static/chunks"]')
  ) as HTMLScriptElement[];

  const codes: string[] = [];
  for (const script of scripts) {
    const src = script.src;
    if (!src) continue;

    let code = chunkCodeCache.get(src);
    if (!code) {
      try {
        const res = await fetch(src);
        if (!res.ok) continue;
        code = await res.text();
        chunkCodeCache.set(src, code);
      } catch {
        continue;
      }
    }
    codes.push(code);
  }
  return codes;
}

/**
 * Search for source info in chunk code (generic method)
 * Search forward from attribute value position for fileName/lineNumber
 */
function extractSourceNearPosition(code: string, position: number): Source | null {
  // Search forward from current position for source info (within 1500 chars)
  const searchRange = code.slice(position, position + 1500);
  const fileMatch = searchRange.match(/fileName:\s*"([^"]+)"/);
  const lineMatch = searchRange.match(/lineNumber:\s*(\d+)/);
  const colMatch = searchRange.match(/columnNumber:\s*(\d+)/);

  if (fileMatch?.[1] && lineMatch?.[1]) {
    return {
      fileName: fileMatch[1],
      lineNumber: parseInt(lineMatch[1], 10),
      columnNumber: colMatch?.[1] ? parseInt(colMatch[1], 10) : 0,
    };
  }
  return null;
}

/**
 * Extract source info for native elements (div/span etc.) from Turbopack chunk code
 * Match precisely via className/id
 */
async function extractSourceFromTurbopackChunksForElement(
  tagName: string,
  className?: string,
  id?: string
): Promise<Source | null> {
  // Build cache key
  const cacheKey = `${tagName}:${className || ""}:${id || ""}`;
  if (elementSignatureSourceCache.has(cacheKey)) {
    return elementSignatureSourceCache.get(cacheKey) ?? null;
  }

  // Cannot match precisely without className or id
  if (!className && !id) {
    elementSignatureSourceCache.set(cacheKey, null);
    return null;
  }

  try {
    const codes = await getAllChunkCodes();

    // Collect all possible search patterns
    const searchPatterns: string[] = [];
    if (id) {
      searchPatterns.push(id);
    }
    if (className) {
      // Split class names, each can be used as search keyword
      const classes = className.split(/\s+/).filter(c => c.length > 2);
      searchPatterns.push(...classes);
    }

    if (searchPatterns.length === 0) {
      elementSignatureSourceCache.set(cacheKey, null);
      return null;
    }

    for (const code of codes) {
      for (const pattern of searchPatterns) {
        // Search for attribute value in code
        let searchIndex = 0;
        while (searchIndex < code.length) {
          const attrIndex = code.indexOf(`"${pattern}"`, searchIndex);
          if (attrIndex === -1) break;

          // Search backward to confirm jsxDEV call (within 800 chars)
          const startRange = Math.max(0, attrIndex - 800);
          const beforeAttr = code.slice(startRange, attrIndex);

          // Check if this is jsxDEV("tagName", or similar call
          // Supports multiple Turbopack formats:
          // - ["jsxDEV"])("div",
          // - jsxDEV("div",
          // - (0, _jsxDevRuntime.jsxDEV)("div",
          // - _jsx("div",
          const jsxPatterns = [
            new RegExp(`\\["jsxDEV"\\]\\)\\("${tagName}",[^}]*$`),
            new RegExp(`jsxDEV\\("${tagName}",[^}]*$`),
            new RegExp(`\\.jsxDEV\\)\\("${tagName}",[^}]*$`),
            new RegExp(`_jsx\\("${tagName}",[^}]*$`),
            new RegExp(`jsx\\("${tagName}",[^}]*$`),
          ];

          const hasJsxCall = jsxPatterns.some(p => p.test(beforeAttr));

          if (hasJsxCall) {
            const source = extractSourceNearPosition(code, attrIndex);
            if (source) {
              elementSignatureSourceCache.set(cacheKey, source);
              return source;
            }
          }

          searchIndex = attrIndex + 1;
        }
      }
    }

    elementSignatureSourceCache.set(cacheKey, null);
    return null;
  } catch {
    return null;
  }
}

/**
 * Extract jsxDEV source info from Turbopack chunk code
 * For React 19 + Turbopack where Fiber has no _debugSource
 */
async function extractSourceFromTurbopackChunks(
  componentName: string
): Promise<Source | null> {
  // Check cache
  if (componentNameSourceCache.has(componentName)) {
    return componentNameSourceCache.get(componentName) ?? null;
  }

  try {
    const codes = await getAllChunkCodes();

    for (const code of codes) {
      // Search for various component call patterns:
      // - (ComponentName,
      // - jsxDEV(ComponentName,
      // - ["jsxDEV"])(ComponentName,
      const searchPatterns = [
        `(${componentName},`,
        `jsxDEV(${componentName},`,
        `jsx(${componentName},`,
      ];

      for (const pattern of searchPatterns) {
        let searchIndex = 0;
        while (searchIndex < code.length) {
          const callIndex = code.indexOf(pattern, searchIndex);
          if (callIndex === -1) break;

          const source = extractSourceNearPosition(code, callIndex);
          if (source) {
            componentNameSourceCache.set(componentName, source);
            return source;
          }

          searchIndex = callIndex + 1;
        }
      }
    }

    // Not found, cache null
    componentNameSourceCache.set(componentName, null);
    return null;
  } catch {
    return null;
  }
}

/**
 * Clear Turbopack chunk cache
 * Useful after HMR updates during development
 */
export function clearTurbopackCache(): void {
  chunkCodeCache.clear();
  componentNameSourceCache.clear();
  elementSignatureSourceCache.clear();
}

/**
 * Get the first rendererInterface (handles multiple react-dom instances)
 */
function getFirstRendererInterface(): { rendererID: number; rendererInterface: RendererInterface } | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ as DevToolsHookWithInterfaces | undefined;
  if (!hook?.rendererInterfaces || hook.rendererInterfaces.size === 0) {
    return null;
  }

  const entries = Array.from(hook.rendererInterfaces.entries());
  const firstEntry = entries[0];
  if (!firstEntry) {
    return null;
  }
  const [rendererID, rendererInterface] = firstEntry;
  return { rendererID, rendererInterface };
}

/**
 * Parse source info returned by inspectElement
 * React DevTools may return:
 * - Array: [componentName, fileName, lineNumber, columnNumber]
 * - Object: { fileName, lineNumber, columnNumber }
 */
function parseInspectElementSource(source: unknown): { fileName: string; lineNumber: number; columnNumber: number } | null {
  if (!source) return null;

  // Array format: [componentName, fileName, lineNumber, columnNumber]
  if (Array.isArray(source) && source.length >= 3) {
    const [, fileName, lineNumber, columnNumber] = source;
    if (typeof fileName === 'string' && typeof lineNumber === 'number') {
      return {
        fileName,
        lineNumber,
        columnNumber: typeof columnNumber === 'number' ? columnNumber : 0,
      };
    }
  }

  // Object format: { fileName, lineNumber, columnNumber }
  if (typeof source === 'object' && source !== null) {
    const src = source as Record<string, unknown>;
    if (typeof src.fileName === 'string' && typeof src.lineNumber === 'number') {
      return {
        fileName: src.fileName,
        lineNumber: src.lineNumber,
        columnNumber: typeof src.columnNumber === 'number' ? src.columnNumber : 0,
      };
    }
  }

  return null;
}

/**
 * Get source location of DOM node via React DevTools 7.0.1+ rendererInterfaces API
 * Most direct method, preferred
 *
 * Returns compiled position, needs source-map reverse lookup
 */
export function getSourceViaRendererInterface(domElement: HTMLElement): Source | null {
  const renderer = getFirstRendererInterface();
  if (!renderer) {
    return null;
  }

  const { rendererID, rendererInterface } = renderer;

  try {
    // 1. Get React internal element ID from DOM
    const elementID = rendererInterface.getElementIDForHostInstance(domElement as any);
    if (!elementID) {
      return null;
    }

    // 2. Use inspectElement for detailed info (including source)
    const inspectedElement = rendererInterface.inspectElement(
      rendererID,   // requestID
      elementID,    // id
      null,         // path
      true          // forceFullData - force full data retrieval
    );

    if (inspectedElement?.value?.source) {
      const parsed = parseInspectElementSource(inspectedElement.value.source);
      if (parsed) {
        return parsed;
      }
    }

    // 3. Fallback: get component function via getElementSourceFunctionById
    if (rendererInterface.getElementSourceFunctionById) {
      const sourceFunc = rendererInterface.getElementSourceFunctionById(elementID);
      if (sourceFunc) {
        // Check __source property on function
        const funcAny = sourceFunc as any;
        if (funcAny.__source) {
          return {
            fileName: funcAny.__source.fileName,
            lineNumber: funcAny.__source.lineNumber,
            columnNumber: funcAny.__source.columnNumber ?? 0,
          };
        }
        if (funcAny._source) {
          return {
            fileName: funcAny._source.fileName,
            lineNumber: funcAny._source.lineNumber,
            columnNumber: funcAny._source.columnNumber ?? 0,
          };
        }
      }
    }
  } catch (e) {
    // Fail silently, fall back to other methods
    if (process.env.NODE_ENV === 'development') {
      console.debug('[LocatorJS] getSourceViaRendererInterface error:', e);
    }
  }

  return null;
}

/**
 * Get source location via Fiber and rendererInterfaces API
 * For cases where we have a Fiber but need its source
 */
export function getSourceViaRendererInterfaceByFiber(fiber: Fiber): Source | null {
  const renderer = getFirstRendererInterface();
  if (!renderer) {
    return null;
  }

  const { rendererID, rendererInterface } = renderer;

  try {
    // Try to get DOM element from fiber.stateNode
    const stateNode = fiber.stateNode;
    if (stateNode instanceof HTMLElement) {
      return getSourceViaRendererInterface(stateNode);
    }

    // For function components, stateNode is null, try child nodes
    let childFiber = fiber.child;
    while (childFiber) {
      if (childFiber.stateNode instanceof HTMLElement) {
        const elementID = rendererInterface.getElementIDForHostInstance(childFiber.stateNode as any);
        if (elementID) {
          const inspectedElement = rendererInterface.inspectElement(
            rendererID,
            elementID,
            null,
            true
          );
          if (inspectedElement?.value?.source) {
            const parsed = parseInspectElementSource(inspectedElement.value.source);
            if (parsed) {
              return parsed;
            }
          }
        }
      }
      childFiber = childFiber.sibling;
    }
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[LocatorJS] getSourceViaRendererInterfaceByFiber error:', e);
    }
  }

  return null;
}

/**
 * Extract sourceURL comment from function toString()
 * Some bundlers append //# sourceURL=xxx at the end of functions
 */
function extractSourceURL(funcStr: string): string | null {
  const match = funcStr.match(/\/\/[#@]\s*sourceURL=(.+?)(?:\s|$)/);
  return match && match[1] ? match[1] : null;
}

/**
 * Extract stack info from React 19+ _debugInfo
 */
function extractSourceFromDebugInfo(fiber: Fiber): Source | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fiberAny = fiber as any;

  if (!fiberAny._debugInfo || !Array.isArray(fiberAny._debugInfo)) {
    return null;
  }

  for (const info of fiberAny._debugInfo) {
    // React Server Components stack info
    if (info.stack && typeof info.stack === "string") {
      // Parse stack to get first valid position
      // Format: "at ComponentName (file:line:column)"
      const match = info.stack.match(
        /at\s+\S+\s+\(([^:]+):(\d+):(\d+)\)/
      );
      if (match) {
        return {
          fileName: match[1],
          lineNumber: parseInt(match[2], 10),
          columnNumber: parseInt(match[3], 10),
        };
      }

      // Alternative format: "ComponentName@file:line:column"
      const firefoxMatch = info.stack.match(
        /\S+@([^:]+):(\d+):(\d+)/
      );
      if (firefoxMatch) {
        return {
          fileName: firefoxMatch[1],
          lineNumber: parseInt(firefoxMatch[2], 10),
          columnNumber: parseInt(firefoxMatch[3], 10),
        };
      }
    }

    // In some cases _debugInfo contains owner info
    if (info.owner && typeof info.owner === "object") {
      const ownerSource = extractSourceFromDebugInfo(info.owner);
      if (ownerSource) {
        return ownerSource;
      }
    }
  }

  return null;
}

/**
 * Get source from component function metadata
 * Some build tools attach __source or similar properties to functions
 */
function extractSourceFromFunctionMeta(
  type: unknown
): Source | null {
  if (typeof type !== "function" && typeof type !== "object") {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typeAny = type as any;

  // Check various possible source properties
  const sourceKeys = [
    "__source",
    "_source",
    "__componentSource",
    "$$source",
    "__debugSource",
  ];

  for (const key of sourceKeys) {
    if (typeAny[key]) {
      const src = typeAny[key];
      if (src.fileName && src.lineNumber) {
        return {
          fileName: src.fileName,
          lineNumber: src.lineNumber,
          columnNumber: src.columnNumber,
        };
      }
    }
  }

  return null;
}

/**
 * Try to get source info from React DevTools hook
 */
function getSourceFromDevTools(fiber: Fiber): Source | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook) {
    return null;
  }

  try {
    // React DevTools may provide inspectElement API
    const renderers = hook.renderers;
    if (renderers) {
      for (const renderer of renderers.values()) {
        // Some React DevTools versions provide source retrieval methods
        if (renderer.getSourceForFiber) {
          const source = renderer.getSourceForFiber(fiber);
          if (source) {
            return source;
          }
        }
      }
    }
  } catch {
    // Ignore errors
  }

  return null;
}

/**
 * Parse Fiber's _debugStack (if present)
 * React 19 dev mode may include component stack
 */
function parseDebugStack(fiber: Fiber): Source | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fiberAny = fiber as any;

  // React 19 may use _debugStack
  const stack = fiberAny._debugStack || fiberAny.__debugStack;
  if (!stack) {
    return null;
  }

  // Try to parse stack string
  if (typeof stack === "string") {
    const lines = stack.split("\n");
    for (const line of lines) {
      // Skip React internal frames
      if (line.includes("react-dom") || line.includes("react.")) {
        continue;
      }

      // Chrome format
      const chromeMatch = line.match(
        /at\s+\S+\s+\((.+?):(\d+):(\d+)\)/
      );
      if (chromeMatch && chromeMatch[1] && chromeMatch[2] && chromeMatch[3]) {
        return {
          fileName: chromeMatch[1],
          lineNumber: parseInt(chromeMatch[2], 10),
          columnNumber: parseInt(chromeMatch[3], 10),
        };
      }

      // Firefox format
      const firefoxMatch = line.match(
        /\S+@(.+?):(\d+):(\d+)/
      );
      if (firefoxMatch && firefoxMatch[1] && firefoxMatch[2] && firefoxMatch[3]) {
        return {
          fileName: firefoxMatch[1],
          lineNumber: parseInt(firefoxMatch[2], 10),
          columnNumber: parseInt(firefoxMatch[3], 10),
        };
      }
    }
  }

  return null;
}

/**
 * Main function: get component's original source location from Fiber
 * Supports async source-map resolution
 */
export async function resolveSourceFromFiber(
  fiber: Fiber
): Promise<Source | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fiberAny = fiber as any;
  const debug = isDebugEnabled();

  // 1. Check cache (use WeakMap only when type is an object)
  if (fiberAny.type && typeof fiberAny.type === 'object' && componentSourceCache.has(fiberAny.type)) {
    const cached = componentSourceCache.get(fiberAny.type) ?? null;
    if (debug && cached) {
      logSourceFound(SourceMethod.CACHE_HIT, fiber, cached, true);
    }
    return cached;
  }

  // 2. [Preferred] Get via React DevTools 7.0.1+ rendererInterfaces API
  // Most direct and reliable, but returns compiled position, needs source-map reverse lookup
  try {
    const rendererInterfaceSource = getSourceViaRendererInterfaceByFiber(fiber);
    if (rendererInterfaceSource && rendererInterfaceSource.fileName) {
      // Try source-map reverse lookup for original position
      const resolved = await resolveOriginalPosition(
        rendererInterfaceSource.fileName,
        rendererInterfaceSource.lineNumber,
        rendererInterfaceSource.columnNumber ?? 0
      );

      const finalSource = resolved || rendererInterfaceSource;
      if (fiberAny.type && typeof fiberAny.type === 'object') {
        componentSourceCache.set(fiberAny.type, finalSource);
      }
      if (debug) {
        logSourceFound(SourceMethod.RENDERER_INTERFACE, fiber, finalSource, true);
        logSourceComplete(true, SourceMethod.RENDERER_INTERFACE, finalSource);
      }
      return finalSource;
    }
  } catch (e) {
    if (debug) logError(SourceMethod.RENDERER_INTERFACE, e);
  }

  // 3. Get from _debugInfo (React 19 Server Components)
  try {
    const debugInfoSource = extractSourceFromDebugInfo(fiber);
    if (debugInfoSource && debugInfoSource.fileName) {
      // Try source-map reverse lookup for original position
      const resolved = await resolveOriginalPosition(
        debugInfoSource.fileName,
        debugInfoSource.lineNumber,
        debugInfoSource.columnNumber ?? 0
      );
      if (resolved && fiberAny.type && typeof fiberAny.type === 'object') {
        componentSourceCache.set(fiberAny.type, resolved);
      }
      if (debug && resolved) {
        logSourceFound(SourceMethod.DEBUG_INFO, fiber, resolved, true);
        logSourceComplete(true, SourceMethod.DEBUG_INFO, resolved);
      }
      return resolved;
    }
  } catch (e) {
    if (debug) logError(SourceMethod.DEBUG_INFO, e);
  }

  // 4. Parse from _debugStack
  try {
    const debugStackSource = parseDebugStack(fiber);
    if (debugStackSource && debugStackSource.fileName) {
      const resolved = await resolveOriginalPosition(
        debugStackSource.fileName,
        debugStackSource.lineNumber,
        debugStackSource.columnNumber ?? 0
      );
      if (resolved && fiberAny.type && typeof fiberAny.type === 'object') {
        componentSourceCache.set(fiberAny.type, resolved);
      }
      if (debug && resolved) {
        logSourceFound(SourceMethod.DEBUG_STACK, fiber, resolved, true);
        logSourceComplete(true, SourceMethod.DEBUG_STACK, resolved);
      }
      return resolved;
    }
  } catch (e) {
    if (debug) logError(SourceMethod.DEBUG_STACK, e);
  }

  // 5. Get from component function metadata
  try {
    const metaSource = extractSourceFromFunctionMeta(fiberAny.type);
    if (metaSource && metaSource.fileName) {
      const resolved = await resolveOriginalPosition(
        metaSource.fileName,
        metaSource.lineNumber,
        metaSource.columnNumber ?? 0
      );
      if (resolved && fiberAny.type && typeof fiberAny.type === 'object') {
        componentSourceCache.set(fiberAny.type, resolved);
      }
      if (debug && resolved) {
        logSourceFound(SourceMethod.FUNCTION_META, fiber, resolved, true);
        logSourceComplete(true, SourceMethod.FUNCTION_META, resolved);
      }
      return resolved;
    }
  } catch (e) {
    if (debug) logError(SourceMethod.FUNCTION_META, e);
  }

  // 6. Get from React DevTools renderers (legacy API)
  try {
    const devToolsSource = getSourceFromDevTools(fiber);
    if (devToolsSource && devToolsSource.fileName) {
      const resolved = await resolveOriginalPosition(
        devToolsSource.fileName,
        devToolsSource.lineNumber,
        devToolsSource.columnNumber ?? 0
      );
      if (resolved && fiberAny.type && typeof fiberAny.type === 'object') {
        componentSourceCache.set(fiberAny.type, resolved);
      }
      if (debug && resolved) {
        logSourceFound(SourceMethod.DEVTOOLS_RENDERERS, fiber, resolved, true);
        logSourceComplete(true, SourceMethod.DEVTOOLS_RENDERERS, resolved);
      }
      return resolved;
    }
  } catch (e) {
    if (debug) logError(SourceMethod.DEVTOOLS_RENDERERS, e);
  }

  // 7. Try to extract sourceURL from function toString()
  if (typeof fiberAny.type === "function") {
    try {
      const funcStr = fiberAny.type.toString();
      const sourceURL = extractSourceURL(funcStr);
      if (sourceURL) {
        // sourceURL is usually a full path but may need parsing
        const resolved: Source = {
          fileName: sourceURL,
          lineNumber: 1, // Cannot determine exact line number
          columnNumber: 0,
        };
        componentSourceCache.set(fiberAny.type, resolved);
        if (debug) {
          logSourceFound(SourceMethod.SOURCE_URL, fiber, resolved, true);
          logSourceComplete(true, SourceMethod.SOURCE_URL, resolved);
        }
        return resolved;
      }
    } catch (e) {
      if (debug) logError(SourceMethod.SOURCE_URL, e);
    }
  }

  // 8. [Turbopack] Extract jsxDEV source info from chunk code
  // For React 19 + Next.js 15 + Turbopack environments
  const isNativeElement = typeof fiberAny.type === "string";
  const componentName = typeof fiberAny.type === "function" ? fiberAny.type.name : null;

  if (isNativeElement) {
    // Native elements (div/span etc.): try precise match by tag + attributes
    const tagName = fiberAny.type as string;
    const props = fiberAny.memoizedProps || {};
    try {
      const turbopackSource = await extractSourceFromTurbopackChunksForElement(
        tagName,
        props.className,
        props.id
      );
      if (turbopackSource) {
        if (debug) {
          logSourceFound(SourceMethod.TURBOPACK_ELEMENT, fiber, turbopackSource, true);
          logSourceComplete(true, SourceMethod.TURBOPACK_ELEMENT, turbopackSource);
        }
        return turbopackSource;
      }
    } catch (e) {
      if (debug) logError(SourceMethod.TURBOPACK_ELEMENT, e);
    }
  } else if (componentName && componentName !== "Anonymous") {
    try {
      const turbopackSource = await extractSourceFromTurbopackChunks(componentName);
      if (turbopackSource) {
        // Turbopack returns component usage location (already original path, no source-map needed)
        if (fiberAny.type && typeof fiberAny.type === "object") {
          componentSourceCache.set(fiberAny.type, turbopackSource);
        }
        if (debug) {
          logSourceFound(SourceMethod.TURBOPACK_COMPONENT, fiber, turbopackSource, true);
          logSourceComplete(true, SourceMethod.TURBOPACK_COMPONENT, turbopackSource);
        }
        return turbopackSource;
      }
    } catch (e) {
      if (debug) logError(SourceMethod.TURBOPACK_COMPONENT, e);
    }
  }

  // 9. Cache null result to avoid repeated lookups (only when type is an object)
  if (fiberAny.type && typeof fiberAny.type === 'object') {
    componentSourceCache.set(fiberAny.type, null);
  }

  return null;
}

/**
 * Synchronous: get from cache only (for non-async contexts)
 */
export function getSourceFromCache(fiber: Fiber): Source | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fiberAny = fiber as any;

  if (fiberAny.type && typeof fiberAny.type === 'object' && componentSourceCache.has(fiberAny.type)) {
    return componentSourceCache.get(fiberAny.type) ?? null;
  }

  return null;
}

/**
 * Clear component source cache
 */
export function clearComponentSourceCache(): void {
  // WeakMap cannot be cleared, would need to create a new one
  // In practice, WeakMap automatically garbage-collects unreferenced keys
}
