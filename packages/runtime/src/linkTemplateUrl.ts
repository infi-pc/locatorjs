import { allTargets } from "@locator/shared";

export let getLinkTypeOrTemplate = () =>
  document.documentElement.dataset.locatorTarget || "vscode";

export let linkTemplate = () => allTargets[getLinkTypeOrTemplate()];

export function linkTemplateUrl(): string {
  const l = linkTemplate();
  return l ? l.url : getLinkTypeOrTemplate();
}
