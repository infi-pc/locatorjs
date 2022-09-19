import { Targets } from "@locator/shared";
import { OptionsStore } from "./optionsStore";

export const getLinkTypeOrTemplate = (
  targets: Targets,
  options: OptionsStore,
  localLinkTypeOrTemplate?: string
) =>
  localLinkTypeOrTemplate ||
  document.documentElement.dataset.locatorTarget ||
  options.getOptions().templateOrTemplateId ||
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
