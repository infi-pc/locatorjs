import { LabelData } from "../LabelData";
import { LinkProps, SimpleDOMRect } from "../types";

export type ElementInfo = {
  box: SimpleDOMRect;
  label: string;
  link: LinkProps | null;
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
