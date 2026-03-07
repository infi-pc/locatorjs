/**
 * LocatorJS Debug Module
 * Helps debug source location resolution and troubleshoot navigation issues.
 *
 * Enable via:
 * 1. Browser console: window.__LOCATORJS_DEBUG__ = true
 * 2. Or call: enableLocatorDebug()
 */

// Source resolution method enum
export const SourceMethod = {
  // Synchronous methods (findDebugSource.ts)
  FIBER_DEBUG_SOURCE: "fiber._debugSource",
  ELEMENT_TYPE_SOURCE: "fiber.elementType._source",
  TYPE_SOURCE: "fiber.type._source",
  FIBER_DEBUG_SOURCE_ALT: "fiber.__debugSource",
  MEMOIZED_PROPS_SOURCE: "fiber.memoizedProps.__source",
  PENDING_PROPS_SOURCE: "fiber.pendingProps.__source",
  DEBUG_INFO_STACK: "fiber._debugInfo[].stack",
  TYPE_COMPONENT_SOURCE: "fiber.type.__componentSource",
  CACHE_HIT: "cache (previously async-resolved)",

  // Asynchronous methods (clickSourceResolver.ts)
  RENDERER_INTERFACE: "rendererInterfaces API (React DevTools 7.0.1+)",
  DEBUG_INFO: "_debugInfo (React 19 Server Components)",
  DEBUG_STACK: "_debugStack (React 19)",
  FUNCTION_META: "function metadata (__source/_source)",
  DEVTOOLS_RENDERERS: "React DevTools renderers (legacy API)",
  SOURCE_URL: "function toString() sourceURL",
  FUNCTION_BODY_JSX: "function toString() JSX source info",
  TURBOPACK_ELEMENT: "Turbopack chunk (native element)",
  TURBOPACK_COMPONENT: "Turbopack chunk (component name)",
} as const;

export type SourceMethodType = (typeof SourceMethod)[keyof typeof SourceMethod];

interface DebugInfo {
  method: SourceMethodType;
  fiberType: string;
  fiberTag: number;
  source: {
    fileName: string;
    lineNumber: number;
    columnNumber?: number;
  } | null;
  async: boolean;
  timestamp: number;
}

// Global debug state
let debugEnabled = false;
const debugHistory: DebugInfo[] = [];
const MAX_HISTORY = 50;

/**
 * Check if debug mode is enabled
 */
export function isDebugEnabled(): boolean {
  // Also check window global variable
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof window !== "undefined" && (window as any).__LOCATORJS_DEBUG__) {
    return true;
  }
  return debugEnabled;
}

/**
 * Enable debug mode
 */
export function enableLocatorDebug(): void {
  debugEnabled = true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof window !== "undefined") {
    (window as any).__LOCATORJS_DEBUG__ = true;
  }
  console.log(
    "%c[LocatorJS Debug] Debug mode enabled",
    "color: #4CAF50; font-weight: bold"
  );
  console.log("View debug history: window.__LOCATORJS_DEBUG_HISTORY__");
  console.log("Disable: window.__LOCATORJS_DEBUG__ = false or disableLocatorDebug()");
}

/**
 * Disable debug mode
 */
export function disableLocatorDebug(): void {
  debugEnabled = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof window !== "undefined") {
    (window as any).__LOCATORJS_DEBUG__ = false;
  }
  console.log(
    "%c[LocatorJS Debug] Debug mode disabled",
    "color: #f44336; font-weight: bold"
  );
}

/**
 * Set debug mode (called from settings panel, silent)
 */
export function setDebugMode(enabled: boolean): void {
  debugEnabled = enabled;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof window !== "undefined") {
    (window as any).__LOCATORJS_DEBUG__ = enabled;
  }
}

/**
 * Get a human-readable description of a Fiber's type
 */
function getFiberTypeDesc(fiber: unknown): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const f = fiber as any;
  if (!f) return "null";

  const type = f.type;
  if (typeof type === "string") {
    return `<${type}>`; // native element e.g. <div>
  }
  if (typeof type === "function") {
    return type.displayName || type.name || "Anonymous";
  }
  if (type && typeof type === "object") {
    // memo/forwardRef etc.
    if (type.displayName) return type.displayName;
    if (type.render?.displayName) return type.render.displayName;
    if (type.render?.name) return type.render.name;
  }
  return "Unknown";
}

/**
 * Log debug info when a source is found
 */
export function logSourceFound(
  method: SourceMethodType,
  fiber: unknown,
  source: { fileName: string; lineNumber: number; columnNumber?: number } | null,
  async = false
): void {
  if (!isDebugEnabled()) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const f = fiber as any;
  const fiberType = getFiberTypeDesc(fiber);
  const fiberTag = f?.tag ?? -1;

  const info: DebugInfo = {
    method,
    fiberType,
    fiberTag,
    source,
    async,
    timestamp: Date.now(),
  };

  // Add to history
  debugHistory.push(info);
  if (debugHistory.length > MAX_HISTORY) {
    debugHistory.shift();
  }

  // Expose on window
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof window !== "undefined") {
    (window as any).__LOCATORJS_DEBUG_HISTORY__ = debugHistory;
  }

  // Console output
  const asyncLabel = async ? "[async]" : "[sync]";
  const methodColor = async ? "#2196F3" : "#4CAF50";

  if (source) {
    console.log(
      `%c[LocatorJS] ${asyncLabel} Source found`,
      `color: ${methodColor}; font-weight: bold`,
      "\nMethod:", method,
      "\nComponent:", fiberType,
      "\nLocation:", `${source.fileName}:${source.lineNumber}:${source.columnNumber ?? 0}`
    );
  } else {
    console.log(
      `%c[LocatorJS] ${asyncLabel} Tried: ${method}`,
      "color: #9E9E9E",
      `(${fiberType}) - not found`
    );
  }
}

/**
 * Log when source resolution starts
 */
export function logSourceStart(fiber: unknown, element?: HTMLElement): void {
  if (!isDebugEnabled()) return;

  const fiberType = getFiberTypeDesc(fiber);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fiberTag = (fiber as any)?.tag ?? -1;

  console.group(
    `%c[LocatorJS] Starting source resolution`,
    "color: #FF9800; font-weight: bold"
  );
  console.log("Fiber:", fiberType, `(tag: ${fiberTag})`);
  if (element) {
    console.log("DOM element:", element);
  }
  console.log("Fiber object:", fiber);
  console.groupEnd();
}

/**
 * Log when source resolution completes
 */
export function logSourceComplete(
  success: boolean,
  method?: SourceMethodType,
  source?: { fileName: string; lineNumber: number; columnNumber?: number } | null
): void {
  if (!isDebugEnabled()) return;

  if (success && source) {
    console.log(
      `%c[LocatorJS] Location complete`,
      "color: #4CAF50; font-weight: bold",
      "\nFinal method:", method,
      "\nTarget location:", `${source.fileName}:${source.lineNumber}:${source.columnNumber ?? 0}`
    );
  } else {
    console.log(
      `%c[LocatorJS] Location failed - no source found via any method`,
      "color: #f44336; font-weight: bold"
    );
  }
}

/**
 * Log an error during source resolution
 */
export function logError(method: SourceMethodType, error: unknown): void {
  if (!isDebugEnabled()) return;

  console.warn(
    `%c[LocatorJS] ${method} error:`,
    "color: #FF9800",
    error
  );
}

/**
 * Register the diagnose function.
 * Called from outside to avoid circular imports (debug.ts must not import resolution modules).
 */
export function registerDiagnose(
  diagnoseFn: () => Promise<void>
): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof window !== "undefined") {
    (window as any).locatorDiagnose = diagnoseFn;
  }
}

// Expose helpers on window at init
if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  w.__LOCATORJS_DEBUG_HISTORY__ = debugHistory;
  w.enableLocatorDebug = enableLocatorDebug;
  w.disableLocatorDebug = disableLocatorDebug;
}
