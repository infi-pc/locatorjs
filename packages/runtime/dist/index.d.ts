import { ReactDevtoolsHook } from "@locator/types";
declare global {
    interface Window {
        __REACT_DEVTOOLS_GLOBAL_HOOK__: ReactDevtoolsHook;
    }
}
declare type LocatorJSMode = "disabled" | "hidden" | "minimal" | "options" | "no-renderer";
declare type Target = {
    url: string;
    label: string;
};
export declare function setup(props: {
    defaultMode?: LocatorJSMode;
    targets?: {
        [k: string]: Target | string;
    };
}): void;
export declare function register(input: any): void;
export default function nonNullable<T>(value: T): value is NonNullable<T>;
export {};
