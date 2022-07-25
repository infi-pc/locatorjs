import { allTargets, Targets } from "@locator/shared";

export function setLocalStorageLinkTemplate(linkOrTemplate: string) {
  localStorage.setItem("LOCATOR_CUSTOM_LINK", linkOrTemplate);
}

export function getLocalStorageLinkTemplate() {
  return localStorage.getItem("LOCATOR_CUSTOM_LINK");
}
export const getLinkTypeOrTemplate = (targets: Targets) =>
  document.documentElement.dataset.locatorTarget ||
  getLocalStorageLinkTemplate() ||
  Object.entries(targets)[0]![0];

export function linkTemplateUrl(targets: Targets): string {
  const templateOrType = getLinkTypeOrTemplate(targets);
  console.log("targets", targets);
  const target = targets[templateOrType];
  if (target) {
    return target.url;
  }
  return templateOrType;
}
