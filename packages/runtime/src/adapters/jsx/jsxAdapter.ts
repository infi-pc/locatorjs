import { findFiberByHtmlElement } from "../react/findFiberByHtmlElement";

import nonNullable from "../../nonNullable";
import { getDataForDataId } from "../../runtimeStore";
import { deduplicateLabels } from "../../deduplicateLabels";
import { LabelData } from "../../LabelData";
import { AdapterObject, FullElementInfo } from "../adapterApi";

export function getElementInfo(found: HTMLElement): FullElementInfo | null {
  // Instead of labels, return this element, parent elements leading to closest component, its component labels, all wrapping components labels.
  let labels: LabelData[] = [];
  if (
    found.dataset &&
    (found.dataset.locatorjsId || found.dataset.locatorjsStyled)
  ) {
    labels = [
      found.dataset.locatorjsId
        ? getDataForDataId(found.dataset.locatorjsId)
        : null,
      found.dataset.locatorjsStyled
        ? getDataForDataId(found.dataset.locatorjsStyled)
        : null,
    ].filter(nonNullable);
  }

  // return deduplicateLabels(labels);

  return null;
}

const reactAdapter: AdapterObject = {
  getElementInfo,
};

export default reactAdapter;
