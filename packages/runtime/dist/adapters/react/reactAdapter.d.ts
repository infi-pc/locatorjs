import { LabelData } from "../../LabelData";
import { SimpleDOMRect } from "../../types";
export declare type ElementInfo = {
    box: SimpleDOMRect;
    label: string;
    link: string;
};
export declare type FullElementInfo = {
    thisElement: ElementInfo;
    htmlElement: HTMLElement;
    parentElements: ElementInfo[];
    componentBox: SimpleDOMRect;
    componentsLabels: LabelData[];
};
export declare function getElementInfo(found: HTMLElement): FullElementInfo | null;
