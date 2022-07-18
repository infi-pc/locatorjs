import { allTargets } from "@locator/shared";

export function setTemplate(linkOrTemplate: string) {
  localStorage.setItem("LOCATOR_CUSTOM_LINK", linkOrTemplate);
}

export const getLinkTypeOrTemplate = () =>
  document.documentElement.dataset.locatorTarget ||
  localStorage.getItem("LOCATOR_CUSTOM_LINK") ||
  "vscode";

export const linkTemplate = () => allTargets[getLinkTypeOrTemplate()];

export function linkTemplateUrl(): string {
  const l = linkTemplate();
  return l ? l.url : getLinkTypeOrTemplate();
}
