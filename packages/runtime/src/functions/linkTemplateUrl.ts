import { Targets } from "@locator/shared";

export function setLocalStorageLinkTemplate(linkOrTemplate: string) {
  localStorage.setItem("LOCATOR_CUSTOM_LINK", linkOrTemplate);
}

export function cleanLocalStorageLinkTemplate() {
  localStorage.removeItem("LOCATOR_CUSTOM_LINK");
}

export function getLocalStorageLinkTemplate() {
  return localStorage.getItem("LOCATOR_CUSTOM_LINK");
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
