import { Fiber } from "@locator/shared";
declare type SimpleElement = {
    type: "element";
    name: string;
    fiber: Fiber;
    box: DOMRect | null;
    element: Element | Text;
    children: (SimpleElement | SimpleComponent)[];
};
declare type SimpleComponent = {
    type: "component";
    name: string;
    fiber: Fiber;
    box: DOMRect | null;
    children: (SimpleElement | SimpleComponent)[];
};
export declare type SimpleNode = SimpleElement | SimpleComponent;
export declare function initRender(solidLayer: HTMLDivElement): void;
export {};
