export * from "./types";
export declare type Target = {
    url: string;
    label: string;
};
export declare type Targets = {
    [k: string]: Target;
};
export declare const allTargets: Targets;
