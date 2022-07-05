import { Fiber, Source } from "@locator/shared";
import { buidLink, buildLinkFromSource } from "../../buidLink";
import { LabelData } from "../../LabelData";
import { getUsableName } from "../../getUsableName";

export function getFiberLabel(fiber: Fiber, source?: Source): LabelData {
  const name = getUsableName(fiber);

  const link = source ? buildLinkFromSource(source) : null;
  const label = {
    label: name,
    link,
  };
  return label;
}
