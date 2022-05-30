export * from "./types";
export declare type Target = {
    url: string;
    label: string;
};
export declare type Targets = {
    [k: string]: Target;
};
export declare const allTargets: Targets;
export declare const isMac: boolean;
export declare const altTitle: string;
export declare const shiftTitle: string;
export declare const ctrlTitle: string;
export declare const metaTitle: string;
export declare const modifiersTitles: {
    alt: string;
    ctrl: string;
    meta: string;
    shift: string;
};
export declare function getModifiersMap(modifiersString: string): {
    [key: string]: true;
};
export declare function getModifiersString(modifiersMap: {
    [key: string]: true;
}): string;
