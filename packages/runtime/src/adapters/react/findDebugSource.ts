import { Fiber, Source } from "@locator/shared";

// Turbopack's SWC JSX transform uses "[project]" as a virtual path prefix
// instead of a real filesystem path. Strip it so the user-configured
// projectPath can be prepended correctly.
export function normaliseSource(source: Source): Source {
  if (source.fileName?.startsWith("[project]")) {
    return { ...source, fileName: source.fileName.slice("[project]".length) };
  }
  return source;
}

export function findDebugSource(
  fiber: Fiber
): { fiber: Fiber; source: Source } | null {
  let current: Fiber | null = fiber;
  while (current) {
    if (current._debugSource) {
      return { fiber: current, source: normaliseSource(current._debugSource) };
    }
    current = current._debugOwner || null;
  }

  return null;
}
