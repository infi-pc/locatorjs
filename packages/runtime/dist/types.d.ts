import { Fiber } from "@locator/shared";
export declare type Source = {
    fileName: string;
    lineNumber: number;
    columnNumber?: number;
};
declare type SimpleElement = {
    type: "element";
    name: string;
    uniqueId: string;
    fiber: Fiber;
    box: DOMRect | null;
    element: Element | Text;
    children: (SimpleElement | SimpleComponent)[];
    source: Source | null;
};
declare type SimpleComponent = {
    type: "component";
    uniqueId: string;
    name: string;
    fiber: Fiber;
    box: DOMRect | null;
    children: (SimpleElement | SimpleComponent)[];
    source: Source | null;
    definitionSourceFile: string | null;
};
export declare type SimpleNode = SimpleElement | SimpleComponent;
export declare type HighlightedNode = {
    getNode: () => SimpleNode | null;
    setNode: (node: SimpleNode | null) => void;
};
export {};
