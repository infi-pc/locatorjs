import { Fiber } from "@locator/shared";
import { ElementInfo } from "./reactAdapter";
export declare function getAllParentsElementsAndRootComponent(fiber: Fiber): {
    component: Fiber;
    componentBox: DOMRect;
    parentElements: ElementInfo[];
};
