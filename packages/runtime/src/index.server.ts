import type { LocatorOptions, Target } from "@locator/shared";
import type { AdapterId } from "./consts";

export const MAX_ZINDEX = 2147483647;

export type SetupOptions = LocatorOptions & {
  adapter?: AdapterId;
  targets?: { [k: string]: Target | string };
};

export function setup(_options: SetupOptions = {}) {
  void _options;
  // LocatorJS only has behavior in a browser. This entry point intentionally
  // stays inert when a framework resolves the package during server rendering.
}

export function getDataForDataId(_dataId: string) {
  void _dataId;
  return null;
}

export default setup;
