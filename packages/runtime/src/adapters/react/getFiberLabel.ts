import { Fiber, Source } from "@locator/shared";
import { buidLink } from "../../buidLink";
import { LabelData } from "../../LabelData";
import { getUsableName } from "../../getUsableName";

export function getFiberLabel(fiber: Fiber, source?: Source): LabelData {
  const name = getUsableName(fiber);

  const link = source
    ? buidLink(source.fileName, "", {
        start: {
          column: source.columnNumber || 0,
          line: source.lineNumber || 0,
        },
        end: {
          column: source.columnNumber || 0,
          line: source.lineNumber || 0,
        },
      })
    : null;
  const label = {
    label: name,
    link,
  };
  return label;
}
