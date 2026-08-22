import { Targets } from "@locator/shared";
import { buildLinkFromSource, buildLink } from "./buildLink";
import { HREF_TARGET } from "../consts";
import { LinkProps, Source } from "../types/types";
import { OptionsStore } from "./optionsStore";
import { editorNeedsSetup } from "./linkTemplateUrl";

export function goTo(link: string, options: OptionsStore) {
  window.open(link, options.effective().hrefTarget || HREF_TARGET);
}

export function goToLinkProps(
  linkProps: LinkProps,
  targets: Targets,
  options: OptionsStore
) {
  goTo(buildLink(linkProps, targets, options), options);
}

export function goToSource(
  source: Source,
  targets: Targets,
  options: OptionsStore
) {
  return goTo(buildLinkFromSource(source, targets, options), options);
}

/**
 * Navigates unless we would be guessing the destination, in which case the
 * caller is told to ask the user to pick an editor first.
 *
 * @returns false when no editor is configured and nothing was opened.
 */
export function goToLinkPropsOrSetup(
  linkProps: LinkProps,
  targets: Targets,
  options: OptionsStore
): boolean {
  if (editorNeedsSetup(targets, options)) return false;
  goToLinkProps(linkProps, targets, options);
  return true;
}
