import { Targets } from "@locator/shared";
import { buildLinkFromSource, buildLink } from "./buildLink";
import { HREF_TARGET } from "../consts";
import { LinkProps, Source } from "../types/types";
import { OptionsStore } from "./optionsStore";

export function goTo(link: string, options: OptionsStore) {
  window.open(link, options.getOptions().hrefTarget);
}

export function goToLinkProps(
  linkProps: LinkProps,
  targets: Targets,
  options: OptionsStore
) {
  const link = buildLink(linkProps, targets, options);
  window.open(link, options.getOptions().hrefTarget || HREF_TARGET);
}

export function goToSource(
  source: Source,
  targets: Targets,
  options: OptionsStore
) {
  return goTo(buildLinkFromSource(source, targets, options), options);
}
