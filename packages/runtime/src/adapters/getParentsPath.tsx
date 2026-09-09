import { getParentsPathsAsync as getReactParentsPathsAsync } from "./react/reactAdapter";
import { detectReact } from "@locator/shared";
import type { SourceResolutionContext } from "./react/sourceMapResolver";
import { ParentPathItem } from "./adapterApi";
import { getAdapter } from "./adapterSelection";

export function getParentsPaths(
  target: HTMLElement,
  adapterId?: string
): ParentPathItem[] {
  return getAdapter(adapterId)?.getParentsPaths?.(target) ?? [];
}

export async function getParentsPathsAsync(
  target: HTMLElement,
  adapterId?: string,
  context?: SourceResolutionContext
): Promise<ParentPathItem[]> {
  if (adapterId === "react" || (!adapterId && detectReact())) {
    return getReactParentsPathsAsync(target, context);
  }
  return getParentsPaths(target, adapterId);
}
