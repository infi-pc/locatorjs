import { LabelData } from "../../LabelData";
declare type ElementInfo = {
    box: DOMRect;
    label: string;
    link: string;
};
export declare type FullElementInfo = {
    thisElement: ElementInfo;
    parentElements: ElementInfo[];
    componentBox: DOMRect;
    componentsLabels: LabelData[];
};
export declare function getElementInfo(found: HTMLElement): FullElementInfo | null;
export {};
