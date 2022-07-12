import { Fiber, Source } from "@locator/shared";
import { buildLinkFromSource } from "../../buidLink";
import { LabelData } from "../../LabelData";
import { getUsableName } from "../../getUsableName";

export function getFiberLabel(fiber: Fiber, source?: Source): LabelData {
  const name = getUsableName(fiber);

  const link = source ? buildLinkFromSource(source) : null;
  const label: LabelData = {
    label: name,
    link: link || "",
  };
  return label;
}
