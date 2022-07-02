import { Fiber } from "@locator/shared";

export type Source = {
  fileName: string;
  lineNumber: number;
  columnNumber?: number;
};

type SimpleElement = {
  type: "element";
  name: string;
  uniqueId: string;
  fiber: Fiber;
  box: DOMRect | null;
  element: Element | Text;
  children: (SimpleElement | SimpleComponent)[];
  source: Source | null;
};

type SimpleComponent = {
  type: "component";
  uniqueId: string;
  name: string;
  fiber: Fiber;
  box: DOMRect | null;
  children: (SimpleElement | SimpleComponent)[];
  source: Source | null;
};

export type SimpleNode = SimpleElement | SimpleComponent;
