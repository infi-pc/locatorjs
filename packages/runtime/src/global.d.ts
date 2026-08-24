import type {
  FileStorage,
  ReactDevtoolsHook,
  WriteResult,
} from "@locator/shared";

declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__: ReactDevtoolsHook;
    __LOCATOR_DATA__?: Record<string, FileStorage>;
    enableLocator: () => Promise<WriteResult>;
  }
}
