import { ReactDevtoolsHook } from "@locator/shared";
import { createReactDevtoolsHook } from "./createReactDevtoolsHook";

export const MARKER = Symbol();

type ReactDevtoolsHookWithMarker = ReactDevtoolsHook & {
  [MARKER]?: typeof MARKER;
};

export function installReactDevtoolsHook() {
  const existingHook: ReactDevtoolsHookWithMarker =
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__;

  if (
    Object.prototype.hasOwnProperty.call(
      window,
      "__REACT_DEVTOOLS_GLOBAL_HOOK__"
    )
  ) {
    if (existingHook[MARKER] === MARKER) {
      // console.log("already installed!!!!!");
      return existingHook;
    }
  }

  const hook = createReactDevtoolsHook({ ...existingHook });

  if (existingHook) {
    existingHook[MARKER] = MARKER;

    for (const [key, value] of Object.entries(hook)) {
      if (typeof value === "function") {
        // @ts-expect-error indexing the hook by an arbitrary key
        delete existingHook[key];
        // @ts-expect-error indexing the hook by an arbitrary key
        existingHook[key] = value;
      }
    }
  } else {
    Object.defineProperty(window, "__REACT_DEVTOOLS_GLOBAL_HOOK__", {
      configurable: false,
      enumerable: false,
      get() {
        return hook;
      },
    });
  }

  return window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
}
