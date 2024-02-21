import { ReactDevtoolsHook } from '@amirrezadev1378/shared';

declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__: ReactDevtoolsHook;
  }
}
