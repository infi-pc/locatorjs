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
  box: SimpleDOMRect | null;
  element: Element | Text;
  children: (SimpleElement | SimpleComponent)[];
  source: Source | null;
};

type SimpleComponent = {
  type: "component";
  uniqueId: string;
  name: string;
  fiber: Fiber;
  box: SimpleDOMRect | null;
  children: (SimpleElement | SimpleComponent)[];
  source: Source | null;
  definitionSourceFile: string | null;
};

export type SimpleNode = SimpleElement | SimpleComponent;

export type HighlightedNode = {
  getNode: () => SimpleNode | null;
  setNode: (node: SimpleNode | null) => void;
};

export type SimpleDOMRect = {
  height: number;
  width: number;
  x: number;
  y: number;
};
