import { LabelData } from "../LabelData";
import { SimpleDOMRect } from "../types";

export type ElementInfo = {
  box: SimpleDOMRect;
  label: string;
  link: string | null;
};

export type FullElementInfo = {
  thisElement: ElementInfo;
  htmlElement: HTMLElement;
  parentElements: ElementInfo[];
  componentBox: SimpleDOMRect;
  componentsLabels: LabelData[];
};

export interface AdapterObject {
  getElementInfo(element: HTMLElement): FullElementInfo | null;
}
