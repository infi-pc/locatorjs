import { Targets } from "@locator/shared";
import { getOptions, setOptions } from "./optionsStore";

export function setLocalStorageLinkTemplate(linkOrTemplate: string) {
  setOptions({ templateOrTemplateId: linkOrTemplate });
}

export function getLocalStorageLinkTemplate() {
  return getOptions().templateOrTemplateId;
}

export const getLinkTypeOrTemplate = (
  targets: Targets,
  localLinkTypeOrTemplate?: string
) =>
  localLinkTypeOrTemplate ||
  document.documentElement.dataset.locatorTarget ||
  getLocalStorageLinkTemplate() ||
  Object.entries(targets)[0]![0];

export function linkTemplateUrl(
  targets: Targets,
  localLinkTypeOrTemplate?: string
): string {
  const templateOrType = getLinkTypeOrTemplate(
    targets,
    localLinkTypeOrTemplate
  );
  const target = targets[templateOrType];
  if (target) {
    return target.url;
  }
  return templateOrType;
}
