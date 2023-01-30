import { Targets } from "@locator/shared";
import { OptionsStore } from "./optionsStore";

export const getLinkTypeOrTemplate = (
  targets: Targets,
  options: OptionsStore,
  localLinkTypeOrTemplate?: string
) =>
  localLinkTypeOrTemplate ||
  options.getOptions().templateOrTemplateId ||
  document.documentElement.dataset.locatorTarget ||
  Object.entries(targets)[0]![0];

export function linkTemplateUrl(
  targets: Targets,
  options: OptionsStore,
  localLinkTypeOrTemplate?: string
): string {
  const templateOrType = getLinkTypeOrTemplate(
    targets,
    options,
    localLinkTypeOrTemplate
  );
  const target = targets[templateOrType];
  if (target) {
    return target.url;
  }
  return templateOrType;
}
