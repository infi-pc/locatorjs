import { ReactDevtoolsHook } from "@locator/shared";
import { FileStorage } from "./types/types";

declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__: ReactDevtoolsHook;
    __LOCATOR_DATA__: { [filename: string]: FileStorage };
  }
}
