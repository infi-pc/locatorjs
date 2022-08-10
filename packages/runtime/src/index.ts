import { Target } from "@locator/shared";
import { AdapterId } from "./consts";
import { initRuntime } from "./initRuntime";
import { isExtension } from "./functions/isExtension";
export * from "./adapters/jsx/runtimeStore";

// Init in case it is used from extension
if (typeof window !== "undefined" && isExtension()) {
  setTimeout(() => initRuntime({}), 0);
}

export const MAX_ZINDEX = 2147483647;

export function setup({
  adapter,
  targets,
  projectPath,
}: {
  adapter?: AdapterId;
  // defaultMode?: LocatorJSMode;
  targets?: { [k: string]: Target | string };
  projectPath?: string;
} = {}) {
  setTimeout(() => initRuntime({ adapter, targets, projectPath }), 0);
}

export default setup;
