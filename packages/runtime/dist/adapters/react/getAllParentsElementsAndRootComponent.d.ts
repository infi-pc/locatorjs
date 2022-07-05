import { Fiber } from "@locator/shared";
import { SimpleDOMRect } from "../../types";
import { ElementInfo } from "./reactAdapter";
export declare function getAllParentsElementsAndRootComponent(fiber: Fiber): {
    component: Fiber;
    componentBox: SimpleDOMRect;
    parentElements: ElementInfo[];
};
