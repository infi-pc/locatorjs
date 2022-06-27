declare type ElementInfo = {
    box: DOMRect;
    label: string;
    link: string;
};
declare type FullElementInfo = {
    thisElement: ElementInfo;
    parentElements: ElementInfo[];
    parentComponents: ElementInfo[];
};
export declare function getElementInfo(found: HTMLElement): FullElementInfo;
export {};
