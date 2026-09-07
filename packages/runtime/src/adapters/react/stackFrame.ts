import { fileUrlToPath } from "./sourceMapResolver";

/**
 * One parser for stack frames, shared by every strategy that reads one.
 *
 * There used to be four, and two of them matched the filename with `([^:]+)`,
 * which cannot match a scheme-prefixed name -- so `about://React/Server/...`,
 * `http://...` and `webpack-internal:///...` all failed and the React 19
 * Server Components strategy never produced a result for real input. The
 * colonless names that did match were bare relative paths, returned as a
 * successful source that no editor can open.
 */
export type StackFrame = {
  /** Cleaned up for display and for opening: schemes stripped, no query. */
  fileName: string;
  /** Exactly as the engine wrote it. The Next dev-server API wants this. */
  rawFileName: string;
  lineNumber: number;
  /** 1-based, as V8 and SpiderMonkey report it. */
  columnNumber: number;
  functionName: string;
  pathKind?: "absolute" | "project-relative";
};

/**
 * Splits a trailing `:line:column` off a location. Anchored at both ends so
 * the filename may itself contain colons, which every URL form does.
 */
const LOCATION = /^(.*):(\d+):(\d+)$/;

/** Chrome/V8: `at Name (location)`, with a location that may contain parens. */
const CHROME_NAMED = /^\s*at\s+(.+?)\s+\((.+)\)\s*$/;
/** Chrome/V8 without a function name: `at location`. */
const CHROME_BARE = /^\s*at\s+(.+?)\s*$/;
/** SpiderMonkey/JavaScriptCore: `name@location`. */
const FIREFOX = /^\s*(.*?)@(.+?)\s*$/;

/**
 * Frames that are never the user's own code. Matching on `node_modules` rather
 * than a list of package names is what keeps this honest: the old list missed
 * `react-jsx-dev-runtime.development.js` -- it contains neither `react.` nor
 * `jsxDEV` -- so React's own JSX runtime was returned as the component source.
 */
const INTERNAL_MARKERS = [
  "node_modules",
  "react_stack_bottom_frame",
  "react-stack-top-frame",
  "fakeJSXCallSite",
  "jsxDEV",
  "jsx-dev-runtime",
  "jsx-runtime",
  "react-dom",
  "react-server-dom",
];

export function isInternalFrame(fileNameOrLine: string): boolean {
  return INTERNAL_MARKERS.some((marker) => fileNameOrLine.includes(marker));
}

/** LocatorJS's own frames, matched precisely enough not to catch a user's. */
export function isLocatorFrame(fileName: string): boolean {
  return (
    fileName.includes("@locator/") ||
    fileName.includes("locatorjs-") ||
    /\blocator\.(bundle|client|dev)\b/.test(fileName)
  );
}

/**
 * Locations emitted by a bundler rather than an original user source file.
 * Keep this predicate at the stack boundary so every resolver strategy applies
 * exactly the same acceptance rule.
 */
export function isCompiledSourceLocation(fileName: string): boolean {
  const normalized = fileName.replace(/\\/g, "/");
  return (
    /^(?:https?:|webpack(?:-internal)?:|blob:)/i.test(normalized) ||
    normalized.includes("/_next/") ||
    normalized.includes("/.next/")
  );
}

/** A final resolver result must be original application code, not tooling. */
export function isOriginalUserSource(fileName: string): boolean {
  return (
    !isCompiledSourceLocation(fileName) &&
    !isInternalFrame(fileName) &&
    !isLocatorFrame(fileName)
  );
}

/**
 * Clean up a stack frame file path.
 * `about://React/Server/file:///path` -> `/path`, and chunk query params go.
 */
export function cleanStackFileName(fileName: string): string {
  let cleaned = fileName;

  if (cleaned.startsWith("about://React/Server/")) {
    cleaned = cleaned.slice("about://React/Server/".length);
  }

  cleaned = fileUrlToPath(cleaned);

  const queryIndex = cleaned.indexOf("?");
  if (queryIndex !== -1) {
    cleaned = cleaned.slice(0, queryIndex);
  }

  return cleaned;
}

function toFrame(
  functionName: string,
  location: string
): StackFrame | undefined {
  const match = LOCATION.exec(location);
  if (!match) return undefined;
  const [, rawFileName, line, column] = match;
  if (!rawFileName || !line || !column) return undefined;
  const unwrapped = rawFileName.startsWith("about://React/Server/")
    ? rawFileName.slice("about://React/Server/".length)
    : rawFileName;
  return {
    fileName: cleanStackFileName(unwrapped),
    rawFileName,
    lineNumber: parseInt(line, 10),
    columnNumber: parseInt(column, 10),
    functionName: functionName.trim() || "<unknown>",
    ...(unwrapped.startsWith("file:") ? { pathKind: "absolute" as const } : {}),
  };
}

/** Parses one line of a stack trace, in any of the engines' formats. */
export function parseStackFrame(line: string): StackFrame | null {
  const named = CHROME_NAMED.exec(line);
  if (named) {
    const frame = toFrame(named[1] ?? "", named[2] ?? "");
    if (frame) return frame;
  }

  const bare = CHROME_BARE.exec(line);
  if (bare) {
    const frame = toFrame("", bare[1] ?? "");
    if (frame) return frame;
  }

  const firefox = FIREFOX.exec(line);
  if (firefox) {
    const frame = toFrame(firefox[1] ?? "", firefox[2] ?? "");
    if (frame) return frame;
  }

  return null;
}

/**
 * The first frame that could be the user's own code. A bare relative path is
 * rejected too: it cannot be opened, and returning it as a success stops the
 * strategies that would have found a real location.
 */
export function firstUserFrame(stack: string): StackFrame | null {
  for (const line of stack.split("\n")) {
    if (isInternalFrame(line)) continue;
    const frame = parseStackFrame(line);
    if (!frame) continue;
    if (isInternalFrame(frame.fileName) || isLocatorFrame(frame.fileName)) {
      continue;
    }
    return frame;
  }
  return null;
}
