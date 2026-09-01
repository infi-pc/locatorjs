import { ReactDevtoolsHook } from '@locator/shared';

declare global {
  const browser: typeof chrome;
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__: ReactDevtoolsHook;
  }
}
