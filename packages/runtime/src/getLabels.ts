import { findDebugSource } from "./findDebugSource";
import { findFiberByHtmlElement } from "./findFiberByHtmlElement";
import { getFiberLabel } from "./getFiberLabel";
import nonNullable, { getDataForDataId } from "./index";
import { getAllParentsWithTheSameBoundingBox } from "./getAllParentsWithTheSameBoundingBox";
import { deduplicateLabels } from "./deduplicateLabels";
import { LabelData } from "./LabelData";

export function getLabels(found: HTMLElement) {
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

  if (labels.length === 0) {
    const fiber = findFiberByHtmlElement(found, false);
    if (fiber) {
      const allPotentialFibers = getAllParentsWithTheSameBoundingBox(fiber);

      // This handles a common case when the component root is basically the comopnent itself, so I want to go to usage of the component
      if (fiber.return && fiber.return === fiber._debugOwner) {
        allPotentialFibers.push(fiber.return);
      }

      allPotentialFibers.forEach((fiber) => {
        const fiberWithSource = findDebugSource(fiber);
        if (fiberWithSource) {
          const label = getFiberLabel(
            fiberWithSource.fiber,
            fiberWithSource.source
          );
          labels.push(label);
        }
      });
    }
  }
  return deduplicateLabels(labels);
}
