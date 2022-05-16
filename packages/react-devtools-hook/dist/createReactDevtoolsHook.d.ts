import { ReactDevtoolsHook } from "@locator/types/src";
declare global {
    interface Window {
        __REACT_DEVTOOLS_GLOBAL_HOOK__: ReactDevtoolsHook;
    }
}
export declare function createReactDevtoolsHook(existing: ReactDevtoolsHook): ReactDevtoolsHook;
