import { Source } from "@locator/shared";
import { firstUserFrame } from "./stackFrame";
import { createTtlCache } from "./ttlCache";

/**
 * Source Map Resolver
 * For Next.js 15+ / React 19+ using Turbopack
 * When traditional _debugSource is unavailable, reverse-lookup via source-map
 */

/**
 * Dev chunk URLs are stable across HMR, so a parsed map has to expire or every
 * click after an edit reports pre-edit line numbers.
 */
const SOURCE_MAP_TTL_MS = 5_000;
const MAX_CACHED_SOURCE_MAPS = 64;

const sourceMapCache = createTtlCache<SourceMapConsumer | null>(
  SOURCE_MAP_TTL_MS,
  MAX_CACHED_SOURCE_MAPS
);

// Loading promise cache to avoid duplicate requests
const loadingPromises = new Map<string, Promise<SourceMapConsumer | null>>();

// Simplified Source Map Consumer interface
/**
 * Positions here use the source-map spec's bases: `line` 1-based, `column`
 * 0-based, in and out. The public helpers below convert, because stack traces
 * report 1-based columns and editors expect them.
 */
interface SourceMapConsumer {
  originalPositionFor(pos: { line: number; column: number }): {
    source: string | null;
    line: number | null;
    column: number | null;
  };
  destroy?: () => void;
}

interface RawSourceMap {
  version: number;
  sources: string[];
  sourcesContent?: string[];
  mappings: string;
  names?: string[];
  file?: string;
  sourceRoot?: string;
}

// Indexed Source Map format (used by Turbopack)
interface IndexedSourceMap {
  version: number;
  sources: string[]; // empty at top level
  sections: Array<{
    offset: { line: number; column: number };
    map: RawSourceMap;
  }>;
}

// VLQ decoding table
const VLQ_BASE_SHIFT = 5;
const VLQ_BASE = 1 << VLQ_BASE_SHIFT;
const VLQ_BASE_MASK = VLQ_BASE - 1;
const VLQ_CONTINUATION_BIT = VLQ_BASE;

const charToInt: Record<string, number> = {};
"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
  .split("")
  .forEach((char, i) => {
    charToInt[char] = i;
  });

/**
 * Decode a VLQ-encoded value
 */
export function decodeVLQ(encoded: string, index: number): [number, number] {
  let result = 0;
  let shift = 0;
  let continuation: boolean;

  do {
    const char = encoded[index++];
    if (char === undefined) {
      throw new Error("Unexpected end of VLQ");
    }
    const digit = charToInt[char];
    if (digit === undefined) {
      throw new Error(`Invalid VLQ character: ${char}`);
    }
    continuation = (digit & VLQ_CONTINUATION_BIT) !== 0;
    // Multiplication, not `<<`: the shift operator is 32-bit and silently
    // wraps past bit 32, corrupting positions in a malformed or unusually
    // large mapping rather than failing.
    result += (digit & VLQ_BASE_MASK) * 2 ** shift;
    shift += VLQ_BASE_SHIFT;
  } while (continuation);

  // Sign bit is in the least significant position
  const isNegative = result & 1;
  result >>= 1;
  return [isNegative ? -result : result, index];
}

export interface MappingSegment {
  generatedColumn: number;
  sourceIndex: number;
  originalLine: number;
  originalColumn: number;
}

/**
 * Parse source map mappings string
 * Returns mappings organized by generated line
 */
export function parseMappings(mappings: string): MappingSegment[][] {
  const lines: MappingSegment[][] = [];

  let generatedColumn = 0;
  let sourceIndex = 0;
  let originalLine = 0;
  let originalColumn = 0;

  let currentLine: MappingSegment[] = [];
  let i = 0;

  while (i < mappings.length) {
    const char = mappings[i];

    if (char === ";") {
      lines.push(currentLine);
      currentLine = [];
      generatedColumn = 0;
      i++;
    } else if (char === ",") {
      i++;
    } else {
      // Parse one segment
      let value: number;

      // 1. generated column (relative to previous segment)
      [value, i] = decodeVLQ(mappings, i);
      generatedColumn += value;

      // Check if there are more fields
      if (i < mappings.length && mappings[i] !== "," && mappings[i] !== ";") {
        // 2. source index
        [value, i] = decodeVLQ(mappings, i);
        sourceIndex += value;

        // 3. original line
        [value, i] = decodeVLQ(mappings, i);
        originalLine += value;

        // 4. original column
        [value, i] = decodeVLQ(mappings, i);
        originalColumn += value;

        // 5. name index (optional, ignored)
        if (i < mappings.length && mappings[i] !== "," && mappings[i] !== ";") {
          [, i] = decodeVLQ(mappings, i);
        }

        currentLine.push({
          generatedColumn,
          sourceIndex,
          originalLine,
          originalColumn,
        });
      }
    }
  }

  // Don't forget the last line
  if (currentLine.length > 0 || mappings.endsWith(";")) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Create a basic Source Map Consumer (standard format)
 */
function createBasicSourceMapConsumer(rawMap: RawSourceMap): SourceMapConsumer {
  const parsedMappings = parseMappings(rawMap.mappings);

  return {
    originalPositionFor(pos: { line: number; column: number }) {
      // line is 1-based, convert to 0-based index
      const lineIndex = pos.line - 1;
      const segments = parsedMappings[lineIndex];

      if (!segments || segments.length === 0) {
        return { source: null, line: null, column: null };
      }

      // Binary search for closest segment
      let low = 0;
      let high = segments.length - 1;

      while (low < high) {
        const mid = Math.ceil((low + high) / 2);
        const midSegment = segments[mid];
        if (midSegment && midSegment.generatedColumn <= pos.column) {
          low = mid;
        } else {
          high = mid - 1;
        }
      }

      const segment = segments[low];
      if (!segment || segment.generatedColumn > pos.column) {
        return { source: null, line: null, column: null };
      }

      const source = rawMap.sources[segment.sourceIndex];
      if (!source) {
        return { source: null, line: null, column: null };
      }

      // Handle sourceRoot
      const fullSource = rawMap.sourceRoot
        ? `${rawMap.sourceRoot}${source}`
        : source;

      return {
        source: fullSource,
        line: segment.originalLine + 1, // Convert back to 1-based
        column: segment.originalColumn,
      };
    },
  };
}

/**
 * Create Indexed Source Map Consumer (Turbopack format)
 * Sections sorted by offset, each has its own map
 */
function createIndexedSourceMapConsumer(
  indexedMap: IndexedSourceMap
): SourceMapConsumer {
  // Pre-parse all section mappings
  const sectionConsumers = indexedMap.sections.map((section) => ({
    offset: section.offset,
    consumer: createBasicSourceMapConsumer(section.map),
    map: section.map,
  }));

  return {
    originalPositionFor(pos: { line: number; column: number }) {
      // Find section containing position (search backward for first offset <= pos)
      let targetSection: (typeof sectionConsumers)[0] | null = null;
      for (let i = sectionConsumers.length - 1; i >= 0; i--) {
        const section = sectionConsumers[i];
        if (!section) continue;
        // offset.line is 0-based, pos.line is 1-based
        const sectionStartLine = section.offset.line + 1;
        if (pos.line >= sectionStartLine) {
          // On same line, also check column
          if (
            pos.line === sectionStartLine &&
            pos.column < section.offset.column
          ) {
            continue;
          }
          targetSection = section;
          break;
        }
      }

      if (!targetSection) {
        return { source: null, line: null, column: null };
      }

      // Calculate position relative to section
      const relativePos = {
        line: pos.line - targetSection.offset.line,
        column:
          pos.line === targetSection.offset.line + 1
            ? pos.column - targetSection.offset.column
            : pos.column,
      };

      return targetSection.consumer.originalPositionFor(relativePos);
    },
  };
}

/**
 * Create Source Map Consumer (auto-detect format)
 */
function createSourceMapConsumer(
  map: RawSourceMap | IndexedSourceMap
): SourceMapConsumer {
  // Detect if this is an Indexed Source Map
  if ("sections" in map && Array.isArray(map.sections)) {
    return createIndexedSourceMapConsumer(map as IndexedSourceMap);
  }
  return createBasicSourceMapConsumer(map as RawSourceMap);
}

/**
 * Load source map from URL
 */
async function loadSourceMap(
  mapUrl: string
): Promise<SourceMapConsumer | null> {
  // Check cache
  if (sourceMapCache.has(mapUrl)) {
    return sourceMapCache.get(mapUrl) ?? null;
  }

  // Check if already loading
  const existing = loadingPromises.get(mapUrl);
  if (existing) {
    return existing;
  }

  const loadPromise = (async () => {
    try {
      const response = await fetch(mapUrl);
      if (!response.ok) {
        sourceMapCache.set(mapUrl, null);
        return null;
      }

      const rawMap: RawSourceMap = await response.json();
      const consumer = createSourceMapConsumer(rawMap);
      sourceMapCache.set(mapUrl, consumer);
      return consumer;
    } catch {
      sourceMapCache.set(mapUrl, null);
      return null;
    } finally {
      loadingPromises.delete(mapUrl);
    }
  })();

  loadingPromises.set(mapUrl, loadPromise);
  return loadPromise;
}

/**
 * Infer source map URL from JS file URL
 */
function inferSourceMapUrl(jsUrl: string): string | null {
  // Handle various bundler source map naming conventions
  if (jsUrl.endsWith(".js")) {
    return `${jsUrl}.map`;
  }
  return null;
}

/**
 * Try to get component source from a stack trace.
 * Core function for environments where _debugSource is unavailable.
 */
export async function resolveSourceFromStack(): Promise<Source | null> {
  try {
    const stack = new Error().stack;
    if (!stack) return null;

    const frame = firstUserFrame(stack);
    if (!frame) return null;

    return (
      (await resolveOriginalPosition(
        frame.fileName,
        frame.lineNumber,
        frame.columnNumber
      )) ?? {
        fileName: frame.fileName,
        lineNumber: frame.lineNumber,
        columnNumber: frame.columnNumber,
      }
    );
  } catch {
    return null;
  }
}

/**
 * Convert file:// URL to local path
 * file:///Users/foo/bar.ts -> /Users/foo/bar.ts
 * file:///C:/foo/bar.ts -> C:/foo/bar.ts (Windows)
 */
export function fileUrlToPath(fileUrl: string): string {
  if (!fileUrl.startsWith("file://")) {
    return fileUrl;
  }

  // Remove file:// prefix
  let path = fileUrl.slice(7);

  // URL decode (handle %40 -> @ etc.)
  try {
    path = decodeURIComponent(path);
  } catch {
    // Keep original if decoding fails
  }

  // Windows path handling: file:///C:/foo -> C:/foo
  if (path.match(/^\/[A-Za-z]:\//)) {
    path = path.slice(1);
  }

  return path;
}

/**
 * Reverse-lookup an original position from a compiled one.
 *
 * `null` means the lookup failed -- no map, no mapping, nothing usable. It
 * used to echo the compiled URL back instead, which callers could not tell
 * from a real result: five of the eight strategies in `resolveSourceFromFiber`
 * accepted `webpack-internal:///...` as the answer and stopped, skipping the
 * strategies that do resolve.
 *
 * `column` is 1-based in and out, matching stack traces and editor links; the
 * source map's own 0-based columns stay behind this boundary.
 */
export async function resolveOriginalPosition(
  compiledUrl: string,
  line: number,
  column: number
): Promise<Source | null> {
  const mapUrl = inferSourceMapUrl(compiledUrl);
  if (!mapUrl) return null;

  const consumer = await loadSourceMap(mapUrl);
  if (!consumer) return null;

  const original = consumer.originalPositionFor({
    line,
    column: Math.max(0, column - 1),
  });
  if (!original.source || !original.line) return null;

  return {
    fileName: fileUrlToPath(original.source),
    lineNumber: original.line,
    columnNumber: original.column === null ? undefined : original.column + 1,
  };
}

/**
 * Preload source maps for all page chunks (optional optimization)
 */
export async function preloadSourceMaps(): Promise<void> {
  // Find all script tags on page
  const scripts = document.querySelectorAll('script[src*=".js"]');
  const loadPromises: Promise<void>[] = [];

  scripts.forEach((script) => {
    const src = script.getAttribute("src");
    if (src && src.includes("/_next/")) {
      const mapUrl = `${src}.map`;
      loadPromises.push(
        loadSourceMap(mapUrl).then(() => {
          /* ignore result */
        })
      );
    }
  });

  await Promise.all(loadPromises);
}

/** Drops every cached map immediately, ahead of the TTL. */
export function clearSourceMapCache(): void {
  sourceMapCache.clear();
  loadingPromises.clear();
}
