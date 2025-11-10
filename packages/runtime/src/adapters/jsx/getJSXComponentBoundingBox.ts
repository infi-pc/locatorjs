import type { FileStorage } from "@locator/shared";
import { mergeRects } from "../../functions/mergeRects";
import { parseDataId, parseDataPath } from "../../functions/parseDataId";
import type { SimpleDOMRect } from "../../types/types";
import { getExpressionData } from "./getExpressionData";

export function getJSXComponentBoundingBox(
  found: HTMLElement,
  locatorData: { [filename: string]: FileStorage },
  componentFolder: string,
  componentId: number
): SimpleDOMRect {
  let composedBox: SimpleDOMRect = found.getBoundingClientRect();
  // Currently it works well only for components with one root element, but for components with multiple root elements we would need to track instance ids.
  function goParent(current: HTMLElement) {
    const parent = current.parentNode;
    if (!parent) {
      return;
    }
    if (parent instanceof HTMLElement) {
      // Check for either data-locatorjs (path-based) or data-locatorjs-id (ID-based)
      if (parent.dataset.locatorjs || parent.dataset.locatorjsId) {
        let fileFullPath: string;

        if (parent.dataset.locatorjs) {
          const parsed = parseDataPath(parent.dataset.locatorjs);
          if (!parsed) {
            goParent(parent);
            return;
          }
          [fileFullPath] = parsed;
        } else if (parent.dataset.locatorjsId) {
          [fileFullPath] = parseDataId(parent.dataset.locatorjsId);
        } else {
          goParent(parent);
          return;
        }

        const fileData: FileStorage | undefined = locatorData[fileFullPath];
        const expData = getExpressionData(parent, fileData || null);
        if (expData) {
          if (
            expData.wrappingComponentId === componentId &&
            componentFolder === fileFullPath
          ) {
            composedBox = mergeRects(
              composedBox,
              parent.getBoundingClientRect()
            );
            goParent(parent);
          }
          expData.wrappingComponentId;
        }
      } else {
        // If there is no locatorjs-id or locatorjs, we should go to the parent, because it can be some library element
        goParent(parent);
      }
    }
  }
  goParent(found);

  return composedBox;
}
