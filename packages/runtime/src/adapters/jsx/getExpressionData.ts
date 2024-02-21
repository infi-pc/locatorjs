import { parseDataId } from "../../functions/parseDataId";
import { ExpressionInfo, FileStorage } from "@amirrezadev1378/shared";

export function getExpressionData(
  target: HTMLElement,
  fileData: FileStorage
): ExpressionInfo | null {
  if (target.dataset.locatorjsId) {
    const [, id] = parseDataId(target.dataset.locatorjsId);
    const expData = fileData.expressions[Number(id)];
    if (expData) {
      return expData;
    }
  }
  return null;
}
