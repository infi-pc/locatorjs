import { ReactDevtoolsHook } from '@locator/shared';

declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__: ReactDevtoolsHook;
  }
}
