import type { LinkProps } from "../types/types";
import { buildLink } from "./buildLink";
import type { OptionsStore } from "./optionsStore";

export function goTo(link: string, options: OptionsStore) {
  window.open(link, options.effective().hrefTarget);
}

export function goToLinkPropsOrSetup(
  linkProps: LinkProps,
  options: OptionsStore
): boolean {
  const editor = options.effective().editor;
  if (editor.kind === "needs-selection") return false;
  goTo(buildLink(linkProps, options, editor), options);
  return true;
}
