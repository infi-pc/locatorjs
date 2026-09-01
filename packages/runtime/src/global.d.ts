import type { FileStorage, ReactDevtoolsHook } from "@locator/shared";
import { strictConfigStorage } from "@locator/shared";

declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__: ReactDevtoolsHook;
    __LOCATOR_DATA__?: Record<string, FileStorage>;
    enableLocator: () => Promise<strictConfigStorage.WriteResult>;
  }
}
