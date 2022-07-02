import { LabelData } from "../../LabelData";
export declare type ElementInfo = {
    box: DOMRect;
    label: string;
    link: string;
};
export declare type FullElementInfo = {
    thisElement: ElementInfo;
    htmlElement: HTMLElement;
    parentElements: ElementInfo[];
    componentBox: DOMRect;
    componentsLabels: LabelData[];
};
export declare function getElementInfo(found: HTMLElement): FullElementInfo | null;
