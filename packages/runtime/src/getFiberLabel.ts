import { Fiber, Source } from "@locator/shared";
import { findNames } from "./findNames";
import { buidLink } from "./buidLink";
import { LabelData } from "./LabelData";
import { getUsableName } from "./getUsableName";

// TODO maybe we don't need source/wrappingComponent because we won't show it in the same label
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
