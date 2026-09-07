import { Source, Fiber, RendererInterface } from "@locator/shared";
import {
  resolveOriginalPosition,
  fileUrlToPath,
  clearSourceMapCache,
  RESOLUTION_DEADLINE_MS,
  throwIfResolutionCancelled,
  type SourceResolutionContext,
} from "./sourceMapResolver";
import {
  cleanStackFileName,
  firstUserFrame,
  isCompiledSourceLocation,
  isOriginalUserSource,
} from "./stackFrame";
import { createTtlCache } from "./ttlCache";
import {
  SourceMethod,
  logSourceFound,
  logSourceComplete,
  logError,
  isDebugEnabled,
  type SourceMethodType,
} from "./debug";

import type { SourcePathKind } from "@locator/shared";

function pathKindForFile(fileName: string): SourcePathKind | undefined {
  return fileName.startsWith("file:") ? "absolute" : undefined;
}

/**
 * Check if a fileName looks like a compiled chunk (not an original source file)
 */
/**
 * Inferred project roots. `undefined` means "not tried yet".
 *
 * Only successes are remembered. Caching the failure meant one early attempt
 * -- before any chunk map was fetchable -- poisoned the whole session: every
 * later click returned the literal `[project]/app/page.tsx` as its file path.
 * A short cooldown keeps a burst of clicks from refetching every map.
 */
let turbopackProjectRoot: string | undefined = undefined;
let turbopackRootRetryAfter = 0;

let nextjsAppRoot: string | undefined = undefined;
let nextjsRootRetryAfter = 0;

const ROOT_RETRY_COOLDOWN_MS = 5_000;

/**
 * The project root implied by an absolute source path ending in `relativePath`,
 * or null if it does not.
 *
 * The match has to land on a separator: `endsWith("app/page.tsx")` alone also
 * accepts `.../some-lib-app/page.tsx` and yields a root one directory too deep.
 */
function rootFromSource(absPath: string, relativePath: string): string | null {
  const suffix = "/" + relativePath;
  if (!absPath.endsWith(suffix)) return null;
  return absPath.slice(0, absPath.length - suffix.length);
}

function sourcesOf(map: {
  sections?: { map?: { sources?: string[] } }[];
  sources?: string[];
}): string[] {
  return map.sections
    ? map.sections.flatMap((section) => section.map?.sources || [])
    : map.sources || [];
}

/**
 * Picks the best root among candidates: anything outside `node_modules` beats
 * anything inside it, so a dependency that happens to ship `app/page.tsx` does
 * not become the project root for every subsequent path.
 */
function bestRoot(candidates: string[]): string | undefined {
  return (
    candidates.find((root) => !root.includes("/node_modules/")) ?? candidates[0]
  );
}

/** Resolve Turbopack's `[project]/` prefix to an absolute path. */
async function resolveProjectPrefix(
  fileName: string,
  context?: SourceResolutionContext
): Promise<{ fileName: string; pathKind?: SourcePathKind }> {
  if (!fileName.startsWith("[project]/")) return { fileName };

  const relativePath = fileName.slice("[project]/".length);

  if (turbopackProjectRoot !== undefined) {
    return {
      fileName: turbopackProjectRoot + "/" + relativePath,
      pathKind: "absolute",
    };
  }
  if (Date.now() < turbopackRootRetryAfter) return { fileName };

  const scripts = candidateChunkUrls(context);

  const candidates: string[] = [];
  for (const scriptUrl of scripts.slice(0, 4)) {
    throwIfResolutionCancelled(context);
    try {
      const map = await boundedJson<{
        sections?: { map?: { sources?: string[] } }[];
        sources?: string[];
      }>(scriptUrl + ".map", context);
      if (!map) continue;

      for (const source of sourcesOf(map)) {
        if (!source.startsWith("file:///")) continue;
        const root = rootFromSource(fileUrlToPath(source), relativePath);
        if (root) candidates.push(root);
      }
      if (candidates.some((root) => !root.includes("/node_modules/"))) break;
    } catch {
      continue;
    }
  }

  const root = bestRoot(candidates);
  if (root === undefined) {
    turbopackRootRetryAfter = Date.now() + ROOT_RETRY_COOLDOWN_MS;
    return { fileName };
  }
  turbopackProjectRoot = root;
  return { fileName: root + "/" + relativePath, pathKind: "absolute" };
}

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

/**
 * Resolved source, keyed by the fiber it was resolved for.
 *
 * Keyed on `fiber.type` this was wrong: the strategies below return *call-site*
 * locations, which differ per instance, while `type` is shared by every
 * instance of a component. Two `<Row/>`s rendered on different lines both
 * opened whichever one was clicked first.
 */
let componentSourceCache = new WeakMap<
  Fiber,
  { source: Source; expiresAt: number }
>();

/**
 * Fetched chunk text. Bounded and short-lived: this holds whole JS bundles,
 * and dev chunk URLs survive HMR, so a stale entry means stale line numbers.
 */
const CHUNK_TTL_MS = 5_000;
const MAX_CACHED_CHUNKS = 24;
const chunkCodeCache = createTtlCache<string>(CHUNK_TTL_MS, MAX_CACHED_CHUNKS);

/**
 * Get all chunk codes (with caching)
 */
function candidateChunkUrls(context?: SourceResolutionContext): string[] {
  const urls = context?.candidateChunkUrls ?? [];
  return [...new Set(urls)].filter((url) => isCompiledSourceLocation(url));
}

async function boundedRead<T>(
  url: string,
  read: (response: Response) => Promise<T>,
  context?: SourceResolutionContext,
  init?: RequestInit
): Promise<T | null> {
  throwIfResolutionCancelled(context);
  const controller = new AbortController();
  const remaining = context
    ? Math.max(0, context.deadline - Date.now())
    : RESOLUTION_DEADLINE_MS;
  const timeout = window.setTimeout(() => controller.abort(), remaining);
  const abort = () => controller.abort();
  context?.signal.addEventListener("abort", abort, { once: true });
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) return null;
    const result = await read(response);
    throwIfResolutionCancelled(context);
    return result;
  } finally {
    window.clearTimeout(timeout);
    context?.signal.removeEventListener("abort", abort);
  }
}

const boundedText = (url: string, context?: SourceResolutionContext) =>
  boundedRead(url, (response) => response.text(), context);

const boundedJson = <T>(
  url: string,
  context?: SourceResolutionContext,
  init?: RequestInit
) =>
  boundedRead(url, (response) => response.json() as Promise<T>, context, init);

async function getCandidateChunkCodes(
  context?: SourceResolutionContext
): Promise<string[]> {
  const urls = candidateChunkUrls(context);
  const codes = await Promise.all(
    urls.slice(0, 4).map(async (src) => {
      const cached = chunkCodeCache.get(src);
      if (cached !== undefined) return cached;
      try {
        const code = await boundedText(src, context);
        if (code === null) return null;
        chunkCodeCache.set(src, code);
        return code;
      } catch {
        return null;
      }
    })
  );
  return codes.filter((code): code is string => code !== null);
}

/**
 * The `{fileName, lineNumber, columnNumber}` literal a JSX transform appends to
 * a `jsxDEV` call. Matched as one object so the three values cannot come from
 * two different call sites -- separate regexes let `fileName` be read from one
 * literal and `lineNumber` from the next.
 */
const SOURCE_LITERAL =
  /\{\s*fileName:\s*"([^"]+)"\s*,\s*lineNumber:\s*(\d+)\s*,\s*columnNumber:\s*(\d+)\s*\}/g;

const SEARCH_WINDOW = 1500;

/**
 * The source literal belonging to the call being inspected.
 *
 * "Belonging to" is the whole difficulty: in compiled JSX the *first* literal
 * after a call site is the one for a nested child, so
 * `<div className="card"><span/></div>` used to resolve the div to the span's
 * line -- and because the three fields were matched by three separate regexes,
 * the filename and the line number could even come from two different objects.
 *
 * The literal we want is a sibling argument of this call, which fixes its
 * brace depth relative to where the search starts. `expectedDepth` says where
 * that is: 0 when starting at the call itself, -1 when starting at an
 * attribute value inside the call's props object.
 */
export function extractSourceNearPosition(
  code: string,
  position: number,
  expectedDepth: number
): Source | null {
  const searchRange = code.slice(position, position + SEARCH_WINDOW);

  let depth = 0;
  for (let i = 0; i < searchRange.length; i += 1) {
    const char = searchRange[i];
    if (char === "}") {
      depth -= 1;
      continue;
    }
    if (char !== "{") continue;

    if (depth === expectedDepth) {
      SOURCE_LITERAL.lastIndex = i;
      const match = SOURCE_LITERAL.exec(searchRange);
      if (match && match.index === i) {
        const [, fileName, line, column] = match;
        if (fileName && line) {
          return {
            fileName,
            lineNumber: parseInt(line, 10),
            columnNumber: column ? parseInt(column, 10) : 0,
          };
        }
      }
    }
    depth += 1;
  }

  return null;
}

/**
 * Recognises a JSX call for `name` immediately before an offset. `name` is
 * either a quoted tag (`"div"`) or a bare component identifier.
 *
 * Hoisted and memoised: these were being recompiled inside the innermost loop
 * of a scan over whole bundles.
 */
const jsxCallPatterns = new Map<string, RegExp>();
function jsxCallPattern(name: string): RegExp {
  let pattern = jsxCallPatterns.get(name);
  if (!pattern) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // `["jsxDEV"])(x,` | `jsxDEV(x,` | `.jsxDEV)(x,` | `_jsx(x,` | `jsx(x,`
    pattern = new RegExp(
      `(?:\\["jsx(?:DEV|s)?"\\]\\)|\\.jsx(?:DEV|s)?\\)|\\b_?jsx(?:DEV|s)?)\\(\\s*${escaped}\\s*,[^}]*$`
    );
    jsxCallPatterns.set(name, pattern);
  }
  return pattern;
}

const BACKTRACK_WINDOW = 800;

function hasJsxCallBefore(code: string, index: number, name: string): boolean {
  const from = Math.max(0, index - BACKTRACK_WINDOW);
  return jsxCallPattern(name).test(code.slice(from, index));
}

/**
 * Source for a native element (div/span/...), found by locating its own
 * className or id in the chunk text.
 *
 * Deliberately uncached. The old key was `tag:className:id`, which is not
 * identifying: every `<div className="card">` in the app shares it and so
 * resolved to one location.
 */
async function extractSourceFromTurbopackChunksForElement(
  tagName: string,
  className?: string,
  id?: string,
  context?: SourceResolutionContext
): Promise<Source | null> {
  if (!className && !id) return null;

  try {
    const codes = await getCandidateChunkCodes(context);

    const searchPatterns: string[] = [];
    if (id) searchPatterns.push(id);
    if (className) searchPatterns.push(className);
    if (searchPatterns.length === 0) return null;

    for (const code of codes) {
      for (const pattern of searchPatterns) {
        let searchIndex = 0;
        while (searchIndex < code.length) {
          const attrIndex = code.indexOf(`"${pattern}"`, searchIndex);
          if (attrIndex === -1) break;

          if (hasJsxCallBefore(code, attrIndex, `"${tagName}"`)) {
            const source = extractSourceNearPosition(code, attrIndex, -1);
            if (source) return source;
          }

          searchIndex = attrIndex + 1;
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Source for a component, found by locating a JSX call to it in the chunk text.
 *
 * A last resort, and treated as one. The match is required to be an actual JSX
 * call: searching for `` `(${name},` `` anywhere also hit `memo(Card,` and
 * `useCallback(Card,`, where the next source literal belongs to something
 * unrelated. Still ambiguous when two files export the same component name --
 * which is exactly why the result is no longer memoised under the bare name.
 */
async function extractSourceFromTurbopackChunks(
  componentName: string,
  context?: SourceResolutionContext
): Promise<Source | null> {
  try {
    const codes = await getCandidateChunkCodes(context);

    for (const code of codes) {
      const source = extractComponentSourceFromChunk(code, componentName);
      if (source) return source;
    }

    return null;
  } catch {
    return null;
  }
}

/** Pure single-chunk scanner used by the bounded fallback and its tests. */
export function extractComponentSourceFromChunk(
  code: string,
  componentName: string
): Source | null {
  let searchIndex = 0;
  while (searchIndex < code.length) {
    const callIndex = code.indexOf(componentName, searchIndex);
    if (callIndex === -1) break;
    const afterName = callIndex + componentName.length;
    if (
      code.startsWith(",", afterName) &&
      hasJsxCallBefore(code, afterName + 1, componentName)
    ) {
      const source = extractSourceNearPosition(code, callIndex, 0);
      if (source) return source;
    }
    searchIndex = callIndex + 1;
  }
  return null;
}

/** Drops cached chunk text immediately, ahead of the TTL. */
function clearTurbopackCache(): void {
  chunkCodeCache.clear();
  turbopackProjectRoot = undefined;
  turbopackRootRetryAfter = 0;
  nextjsAppRoot = undefined;
  nextjsRootRetryAfter = 0;
  componentSourceCache = new WeakMap();
}

/**
 * Get the first rendererInterface (handles multiple react-dom instances)
 */
function getFirstRendererInterface(): {
  rendererID: number;
  rendererInterface: RendererInterface;
} | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- React DevTools exposes version-specific private fields.
  const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ as
    | DevToolsHookWithInterfaces
    | undefined;
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
function parseInspectElementSource(source: unknown): {
  fileName: string;
  lineNumber: number;
  columnNumber: number;
  pathKind?: SourcePathKind;
} | null {
  if (!source) return null;

  // Array format: [componentName, fileName, lineNumber, columnNumber]
  if (Array.isArray(source) && source.length >= 3) {
    const [, fileName, lineNumber, columnNumber] = source;
    if (typeof fileName === "string" && typeof lineNumber === "number") {
      return {
        fileName,
        lineNumber,
        columnNumber: typeof columnNumber === "number" ? columnNumber : 0,
        pathKind: pathKindForFile(fileName),
      };
    }
  }

  // Object format: { fileName, lineNumber, columnNumber }
  if (typeof source === "object" && source !== null) {
    const src = source as Record<string, unknown>;
    if (
      typeof src.fileName === "string" &&
      typeof src.lineNumber === "number"
    ) {
      return {
        fileName: src.fileName,
        lineNumber: src.lineNumber,
        columnNumber:
          typeof src.columnNumber === "number" ? src.columnNumber : 0,
        pathKind: pathKindForFile(src.fileName),
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
function getSourceViaRendererInterface(domElement: HTMLElement): Source | null {
  const renderer = getFirstRendererInterface();
  if (!renderer) {
    return null;
  }

  const { rendererID, rendererInterface } = renderer;

  try {
    // 1. Get React internal element ID from DOM
    const elementID = rendererInterface.getElementIDForHostInstance(
      domElement as any
    );
    if (!elementID) {
      return null;
    }

    // 2. Use inspectElement for detailed info (including source)
    const inspectedElement = rendererInterface.inspectElement(
      rendererID, // requestID
      elementID, // id
      null, // path
      true // forceFullData - force full data retrieval
    );

    if (inspectedElement?.value?.source) {
      const parsed = parseInspectElementSource(inspectedElement.value.source);
      if (parsed) {
        return parsed;
      }
    }

    // 3. Fallback: get component function via getElementSourceFunctionById
    if (rendererInterface.getElementSourceFunctionById) {
      const sourceFunc =
        rendererInterface.getElementSourceFunctionById(elementID);
      if (sourceFunc) {
        // Check __source property on function
        const funcAny = sourceFunc as any;
        if (funcAny.__source) {
          return {
            fileName: funcAny.__source.fileName,
            lineNumber: funcAny.__source.lineNumber,
            columnNumber: funcAny.__source.columnNumber ?? 0,
            pathKind: pathKindForFile(funcAny.__source.fileName),
          };
        }
        if (funcAny._source) {
          return {
            fileName: funcAny._source.fileName,
            lineNumber: funcAny._source.lineNumber,
            columnNumber: funcAny._source.columnNumber ?? 0,
            pathKind: pathKindForFile(funcAny._source.fileName),
          };
        }
      }
    }
  } catch (e) {
    // Fail silently, fall back to other methods
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console -- debug mode deliberately emits resolver diagnostics.
      console.debug("[LocatorJS] getSourceViaRendererInterface error:", e);
    }
  }

  return null;
}

/**
 * Get source location via Fiber and rendererInterfaces API
 * For cases where we have a Fiber but need its source
 */
function getSourceViaRendererInterfaceByFiber(fiber: Fiber): Source | null {
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
        const elementID = rendererInterface.getElementIDForHostInstance(
          childFiber.stateNode as any
        );
        if (elementID) {
          const inspectedElement = rendererInterface.inspectElement(
            rendererID,
            elementID,
            null,
            true
          );
          if (inspectedElement?.value?.source) {
            const parsed = parseInspectElementSource(
              inspectedElement.value.source
            );
            if (parsed) {
              return parsed;
            }
          }
        }
      }
      childFiber = childFiber.sibling;
    }
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console -- debug mode deliberately emits resolver diagnostics.
      console.debug(
        "[LocatorJS] getSourceViaRendererInterfaceByFiber error:",
        e
      );
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
 * Extract source info from JSX-embedded fileName/lineNumber in function body
 * Turbopack's JSX transform embeds source info as arguments to jsxDEV calls
 * inside the function body (visible via toString()).
 */
function extractSourceFromFunctionBody(funcStr: string): Source | null {
  const fileMatch = funcStr.match(/fileName:\s*"([^"]+)"/);
  const lineMatch = funcStr.match(/lineNumber:\s*(\d+)/);
  if (fileMatch?.[1] && lineMatch?.[1]) {
    const colMatch = funcStr.match(/columnNumber:\s*(\d+)/);
    return {
      fileName: fileMatch[1],
      lineNumber: parseInt(lineMatch[1], 10),
      columnNumber: colMatch?.[1] ? parseInt(colMatch[1], 10) : 0,
      pathKind: "project-relative",
    };
  }
  return null;
}

/**
 * Extract stack info from React 19+ _debugInfo
 */
function extractSourceFromDebugInfo(fiber: Fiber): Source | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- React fibers expose private metadata without a stable public type.
  const fiberAny = fiber as any;

  if (!fiberAny._debugInfo || !Array.isArray(fiberAny._debugInfo)) {
    return null;
  }

  for (const info of fiberAny._debugInfo) {
    // React Server Components stack info
    if (info.stack && typeof info.stack === "string") {
      const frame = firstUserFrame(info.stack);
      if (frame) {
        return {
          fileName: frame.fileName,
          lineNumber: frame.lineNumber,
          columnNumber: frame.columnNumber,
          pathKind: frame.pathKind,
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
function extractSourceFromFunctionMeta(type: unknown): Source | null {
  if (typeof type !== "function" && typeof type !== "object") {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- React fibers expose private metadata without a stable public type.
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
          pathKind: pathKindForFile(src.fileName),
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- React fibers expose private metadata without a stable public type.
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

interface DebugStackResult {
  source: Source;
  /** Raw file URL from the stack frame (before cleaning), needed for Next.js API */
  rawFileUrl: string;
  /** Method/component name from the stack frame */
  methodName: string;
}

/**
 * Parse Fiber's `_debugStack` (React 19 dev mode), which holds an Error
 * captured at the JSX call site.
 */
function parseDebugStack(fiber: Fiber): DebugStackResult | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- React DevTools renderers are version-specific private APIs.
  const fiberAny = fiber as any;

  const rawStack = fiberAny._debugStack || fiberAny.__debugStack;
  if (!rawStack) {
    return null;
  }

  let stackStr: string | null = null;
  if (typeof rawStack === "string") {
    stackStr = rawStack;
  } else if (
    rawStack instanceof Error ||
    (typeof rawStack === "object" && typeof rawStack.stack === "string")
  ) {
    stackStr = rawStack.stack;
  }

  if (!stackStr) {
    return null;
  }

  const frame = firstUserFrame(stackStr);
  if (!frame) return null;

  return {
    source: {
      fileName: frame.fileName,
      lineNumber: frame.lineNumber,
      columnNumber: frame.columnNumber,
      pathKind: frame.pathKind,
    },
    rawFileUrl: frame.rawFileName,
    methodName: frame.functionName,
  };
}

/**
 * Resolve a relative path from Next.js API to an absolute path
 * Uses /__nextjs_source-map to get the SSR chunk's source map and find file:// absolute paths
 */
async function resolveNextjsRelativePath(
  relativePath: string,
  rawChunkUrl: string,
  context?: SourceResolutionContext
): Promise<{ fileName: string; pathKind?: SourcePathKind }> {
  if (nextjsAppRoot !== undefined) {
    return {
      fileName: nextjsAppRoot + "/" + relativePath,
      pathKind: "absolute",
    };
  }
  if (Date.now() < nextjsRootRetryAfter) return { fileName: relativePath };

  const candidates: string[] = [];
  try {
    const map = await boundedJson<{
      sections?: { map?: { sources?: string[] } }[];
      sources?: string[];
    }>(
      `/__nextjs_source-map?filename=${encodeURIComponent(rawChunkUrl)}`,
      context
    );
    if (map) {
      for (const source of sourcesOf(map)) {
        if (!source.startsWith("file:///")) continue;
        const root = rootFromSource(fileUrlToPath(source), relativePath);
        if (root) candidates.push(root);
      }
    }
  } catch {
    // Fall through to the cooldown below.
  }

  const root = bestRoot(candidates);
  if (root === undefined) {
    nextjsRootRetryAfter = Date.now() + ROOT_RETRY_COOLDOWN_MS;
    return { fileName: relativePath, pathKind: "project-relative" };
  }
  nextjsAppRoot = root;
  return { fileName: root + "/" + relativePath, pathKind: "absolute" };
}

/**
 * Resolve source via Next.js dev server's stack frame API
 * Uses /__nextjs_original-stack-frames (internal API used by error overlay)
 * Only works in Next.js dev mode
 */
async function resolveViaNextDevServer(
  rawFileUrl: string,
  line: number,
  column: number,
  methodName: string,
  context?: SourceResolutionContext
): Promise<Source | null> {
  try {
    throwIfResolutionCancelled(context);
    const result = await boundedJson<
      Array<{
        status: string;
        value?: {
          originalStackFrame?: {
            file?: string;
            ignored?: boolean;
            line1?: number;
            column1?: number;
          };
        };
      }>
    >("/__nextjs_original-stack-frames", context, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        frames: [
          {
            file: rawFileUrl,
            methodName,
            line1: line,
            column1: column,
          },
        ],
        isServer: true,
        isAppDirectory: true,
      }),
    });
    if (!Array.isArray(result) || result.length === 0) return null;

    const entry = result[0];
    if (!entry) return null;
    if (entry.status !== "fulfilled" || !entry.value?.originalStackFrame) {
      return null;
    }

    const sf = entry.value.originalStackFrame;
    if (!sf.file || sf.ignored) return null;

    // The API returns relative paths (e.g. "app/page.tsx")
    // Resolve to absolute via SSR chunk source map
    let fileName = sf.file;
    if (!fileName.startsWith("/")) {
      fileName = (
        await resolveNextjsRelativePath(fileName, rawFileUrl, context)
      ).fileName;
    }

    return {
      fileName,
      lineNumber: sf.line1 ?? 1,
      columnNumber: sf.column1 ?? 0,
      pathKind: sf.file.startsWith("/") ? "absolute" : "project-relative",
    };
  } catch {
    return null;
  }
}

/**
 * Main function: get component's original source location from Fiber
 * Supports async source-map resolution
 */
export async function resolveSourceFromFiber(
  fiber: Fiber,
  context?: SourceResolutionContext
): Promise<Source | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- React fibers expose private metadata without a stable public type.
  const fiberAny = fiber as any;
  const debug = isDebugEnabled();
  const candidateChunks = new Set(context?.candidateChunkUrls ?? []);
  const operationContext = (): SourceResolutionContext | undefined =>
    context && { ...context, candidateChunkUrls: [...candidateChunks] };
  throwIfResolutionCancelled(context);

  // 1. Cache, keyed on this fiber -- see `componentSourceCache`.
  const cached = readCachedSource(fiber);
  if (cached !== undefined) {
    if (debug && cached) {
      logSourceFound(SourceMethod.CACHE_HIT, fiber, cached, true);
    }
    return cached;
  }

  /**
   * Records a resolution and reports it. Every strategy funnels through here
   * so none of them can accept a compiled chunk URL or framework source as an
   * answer: doing that opens an unusable/wrong file and, worse, stops the
   * strategies below from ever running.
   */
  const accept = (source: Source, method: SourceMethodType): Source | null => {
    throwIfResolutionCancelled(context);
    if (!isOriginalUserSource(source.fileName)) return null;
    componentSourceCache.set(fiber, {
      source,
      expiresAt: Date.now() + CHUNK_TTL_MS,
    });
    if (debug) {
      logSourceFound(method, fiber, source, true);
      logSourceComplete(true, method, source);
    }
    return source;
  };

  // 2. [Preferred] React DevTools 7.0.1+ rendererInterfaces API. Returns a
  //    compiled position, so it needs a source-map lookup.
  try {
    const rendererSource = getSourceViaRendererInterfaceByFiber(fiber);
    if (rendererSource?.fileName) {
      const cleaned = cleanStackFileName(rendererSource.fileName);
      if (isCompiledSourceLocation(cleaned)) candidateChunks.add(cleaned);
      const resolved =
        (await resolveOriginalPosition(
          cleaned,
          rendererSource.lineNumber,
          rendererSource.columnNumber ?? 1,
          operationContext()
        )) ??
        (isCompiledSourceLocation(cleaned)
          ? null
          : { ...rendererSource, fileName: cleaned });
      const accepted =
        resolved && accept(resolved, SourceMethod.RENDERER_INTERFACE);
      if (accepted) return accepted;
    }
  } catch (e) {
    if (debug) logError(SourceMethod.RENDERER_INTERFACE, e);
  }

  // 3. _debugInfo (React 19 Server Components).
  try {
    const debugInfoSource = extractSourceFromDebugInfo(fiber);
    if (debugInfoSource?.fileName) {
      const resolved =
        (await resolveOriginalPosition(
          debugInfoSource.fileName,
          debugInfoSource.lineNumber,
          debugInfoSource.columnNumber ?? 1,
          operationContext()
        )) ?? debugInfoSource;
      const accepted = accept(resolved, SourceMethod.DEBUG_INFO);
      if (accepted) return accepted;
    }
  } catch (e) {
    if (debug) logError(SourceMethod.DEBUG_INFO, e);
  }

  // 4. _debugStack -- an Error captured at the JSX call site.
  try {
    const debugStackResult = parseDebugStack(fiber);
    if (debugStackResult?.source.fileName) {
      const {
        source: debugStackSource,
        rawFileUrl,
        methodName,
      } = debugStackResult;

      if (isCompiledSourceLocation(debugStackSource.fileName)) {
        const cleanedChunk = cleanStackFileName(rawFileUrl);
        if (isCompiledSourceLocation(cleanedChunk)) {
          candidateChunks.add(cleanedChunk);
        }
        const resolved = await resolveOriginalPosition(
          debugStackSource.fileName,
          debugStackSource.lineNumber,
          debugStackSource.columnNumber ?? 1,
          operationContext()
        );
        const accepted = resolved && accept(resolved, SourceMethod.DEBUG_STACK);
        if (accepted) return accepted;

        // Client-side maps are not always served for SSR chunks; the Next dev
        // server can resolve those.
        const nextResolved = await resolveViaNextDevServer(
          rawFileUrl,
          debugStackSource.lineNumber,
          debugStackSource.columnNumber ?? 1,
          methodName,
          operationContext()
        );
        const acceptedNext =
          nextResolved && accept(nextResolved, SourceMethod.DEBUG_STACK);
        if (acceptedNext) return acceptedNext;
        // Both failed -- fall through and let a later strategy or the parent
        // fiber try.
      } else {
        const accepted = accept(debugStackSource, SourceMethod.DEBUG_STACK);
        if (accepted) return accepted;
      }
    }
  } catch (e) {
    if (debug) logError(SourceMethod.DEBUG_STACK, e);
  }

  // 5. Component function metadata.
  try {
    const metaSource = extractSourceFromFunctionMeta(fiberAny.type);
    if (metaSource?.fileName) {
      const resolved =
        (await resolveOriginalPosition(
          metaSource.fileName,
          metaSource.lineNumber,
          metaSource.columnNumber ?? 1,
          operationContext()
        )) ?? metaSource;
      const accepted = accept(resolved, SourceMethod.FUNCTION_META);
      if (accepted) return accepted;
    }
  } catch (e) {
    if (debug) logError(SourceMethod.FUNCTION_META, e);
  }

  // 6. React DevTools renderers (legacy API).
  try {
    const devToolsSource = getSourceFromDevTools(fiber);
    if (devToolsSource?.fileName) {
      const resolved =
        (await resolveOriginalPosition(
          devToolsSource.fileName,
          devToolsSource.lineNumber,
          devToolsSource.columnNumber ?? 1,
          operationContext()
        )) ?? devToolsSource;
      const accepted = accept(resolved, SourceMethod.DEVTOOLS_RENDERERS);
      if (accepted) return accepted;
    }
  } catch (e) {
    if (debug) logError(SourceMethod.DEVTOOLS_RENDERERS, e);
  }

  // 7. sourceURL comment, then JSX literals, in the function's own text.
  if (typeof fiberAny.type === "function") {
    try {
      const funcStr = fiberAny.type.toString();
      const sourceURL = extractSourceURL(funcStr);
      if (sourceURL) {
        const accepted = accept(
          { fileName: sourceURL, lineNumber: 1, columnNumber: 0 },
          SourceMethod.SOURCE_URL
        );
        if (accepted) return accepted;
      }

      const bodySource = extractSourceFromFunctionBody(funcStr);
      if (bodySource?.fileName) {
        const resolvedPath = await resolveProjectPrefix(
          bodySource.fileName,
          operationContext()
        );
        bodySource.fileName = resolvedPath.fileName;
        bodySource.pathKind = resolvedPath.pathKind;
        const accepted = accept(bodySource, SourceMethod.FUNCTION_BODY_JSX);
        if (accepted) return accepted;
      }
    } catch (e) {
      if (debug) logError(SourceMethod.SOURCE_URL, e);
    }
  }

  // 8. [Turbopack] Scrape the chunk text. Last resort: see the caveats on
  //    `extractSourceFromTurbopackChunks`.
  const isNativeElement = typeof fiberAny.type === "string";
  const componentName =
    typeof fiberAny.type === "function" ? fiberAny.type.name : null;

  if (isNativeElement) {
    const props = fiberAny.memoizedProps || {};
    try {
      const turbopackSource = await extractSourceFromTurbopackChunksForElement(
        fiberAny.type as string,
        props.className,
        props.id,
        operationContext()
      );
      if (turbopackSource) {
        const resolvedPath = await resolveProjectPrefix(
          turbopackSource.fileName,
          operationContext()
        );
        turbopackSource.fileName = resolvedPath.fileName;
        turbopackSource.pathKind = resolvedPath.pathKind;
        const accepted = accept(
          turbopackSource,
          SourceMethod.TURBOPACK_ELEMENT
        );
        if (accepted) return accepted;
      }
    } catch (e) {
      if (debug) logError(SourceMethod.TURBOPACK_ELEMENT, e);
    }
  } else if (componentName && componentName !== "Anonymous") {
    try {
      const turbopackSource = await extractSourceFromTurbopackChunks(
        componentName,
        operationContext()
      );
      if (turbopackSource) {
        const resolvedPath = await resolveProjectPrefix(
          turbopackSource.fileName,
          operationContext()
        );
        turbopackSource.fileName = resolvedPath.fileName;
        turbopackSource.pathKind = resolvedPath.pathKind;
        const accepted = accept(
          turbopackSource,
          SourceMethod.TURBOPACK_COMPONENT
        );
        if (accepted) return accepted;
      }
    } catch (e) {
      if (debug) logError(SourceMethod.TURBOPACK_COMPONENT, e);
    }
  }

  return null;
}

/**
 * A fiber and its alternate describe the same instance across renders, so
 * either may carry the cached result. `undefined` means "not cached".
 */
function readCachedSource(fiber: Fiber): Source | undefined {
  const direct = componentSourceCache.get(fiber);
  if (direct) {
    if (direct.expiresAt > Date.now()) return direct.source;
    componentSourceCache.delete(fiber);
  }
  const alternate = (fiber as unknown as { alternate?: Fiber }).alternate;
  const alternateEntry = alternate && componentSourceCache.get(alternate);
  if (alternate && alternateEntry) {
    if (alternateEntry.expiresAt > Date.now()) return alternateEntry.source;
    componentSourceCache.delete(alternate);
  }
  return undefined;
}

/**
 * Synchronous: get from cache only (for non-async contexts)
 */
export function getSourceFromCache(fiber: Fiber): Source | null {
  return readCachedSource(fiber) ?? null;
}

/** Test/HMR seam for all positive resolver caches. */
let resetAdapterCaches: () => void = () => undefined;

export function registerAdapterCacheReset(reset: () => void): void {
  resetAdapterCaches = reset;
}

export function resetSourceResolutionCaches(): void {
  clearTurbopackCache();
  clearSourceMapCache();
  resetAdapterCaches();
}
