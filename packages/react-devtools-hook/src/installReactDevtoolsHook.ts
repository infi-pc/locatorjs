import { ReactDevtoolsHook } from "@locator/types/src";
import { createReactDevtoolsHook } from "./createReactDevtoolsHook";

export const MARKER = Symbol();

type ReactDevtoolsHookWithMarker = ReactDevtoolsHook & {
  [MARKER]?: typeof MARKER;
};

export function installReactDevtoolsHook() {
  const existingHook: ReactDevtoolsHookWithMarker =
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  console.log("install hook, existing:", existingHook);

  if (window.hasOwnProperty("__REACT_DEVTOOLS_GLOBAL_HOOK__")) {
    if (existingHook[MARKER] === MARKER) {
      console.log("already installed!!!!!");
      return existingHook;
    }
  }

  const hook = createReactDevtoolsHook({ ...existingHook });

  if (existingHook) {
    console.log("Magic here!!!!!");
    existingHook[MARKER] = MARKER;

    for (const [key, value] of Object.entries(hook)) {
      if (typeof value === "function") {
        // @ts-ignore
        delete existingHook[key];
        // @ts-ignore
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
