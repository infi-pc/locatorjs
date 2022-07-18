import { allTargets } from "@locator/shared";

function setCookie(name: string, value: string) {
  document.cookie = name + "=" + (value || "") + "; path=/";
}

export function setTemplate(linkOrTemplate: string) {
  setCookie("LOCATOR_CUSTOM_LINK", linkOrTemplate);
}

function getCookie(name: string) {
  if (typeof document === "undefined") {
    return;
  }
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  if (match) return match[2];
}

export const getLinkTypeOrTemplate = () =>
  document.documentElement.dataset.locatorTarget ||
  getCookie("LOCATOR_CUSTOM_LINK") ||
  "vscode";

export const linkTemplate = () => allTargets[getLinkTypeOrTemplate()];

export function linkTemplateUrl(): string {
  const l = linkTemplate();
  return l ? l.url : getLinkTypeOrTemplate();
}
