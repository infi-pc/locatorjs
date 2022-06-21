import { ReactDevtoolsHook, Target } from "@locator/shared";
import { LabelData } from "./LabelData";
declare global {
    interface Window {
        __REACT_DEVTOOLS_GLOBAL_HOOK__: ReactDevtoolsHook;
    }
}
declare type LocatorJSMode = "disabled" | "hidden" | "minimal" | "options" | "xray" | "no-renderer";
export declare let linkTemplateUrl: () => string;
export declare function setup(props: {
    defaultMode?: LocatorJSMode;
    targets?: {
        [k: string]: Target | string;
    };
}): void;
export declare function register(input: any): void;
export declare function getDataForDataId(dataId: string): LabelData | null;
export default function nonNullable<T>(value: T): value is NonNullable<T>;
export {};
