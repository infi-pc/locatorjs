import { Fiber, Source } from "@locator/shared";
import { LabelData } from "../../LabelData";
import { getUsableName } from "../../getUsableName";

export function getFiberLabel(fiber: Fiber, source?: Source): LabelData {
  const name = getUsableName(fiber);

  const label: LabelData = {
    label: name,
    link: source
      ? {
          filePath: source.fileName,
          projectPath: "",
          line: source.lineNumber,
          column: source.columnNumber || 0,
        }
      : null,
  };
  return label;
}
