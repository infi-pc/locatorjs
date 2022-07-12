import { parseDataId } from "../../parseDataId";
import { ExpressionInfo, FileStorage } from "@locator/shared";

export function getExpressionData(
  target: HTMLElement,
  fileData: FileStorage
): ExpressionInfo | null {
  if (target.dataset.locatorjsId) {
    const [_, id] = parseDataId(target.dataset.locatorjsId);
    const expData = fileData.expressions[Number(id)];
    if (expData) {
      return expData;
    }
  }
  return null;
}
