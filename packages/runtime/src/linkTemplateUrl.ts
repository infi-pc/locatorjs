import { allTargets } from "@locator/shared";

export const getLinkTypeOrTemplate = () =>
  document.documentElement.dataset.locatorTarget || "vscode";

export const linkTemplate = () => allTargets[getLinkTypeOrTemplate()];

export function linkTemplateUrl(): string {
  const l = linkTemplate();
  return l ? l.url : getLinkTypeOrTemplate();
}
