import { Targets } from "@locator/shared";
import { buildLinkFromSource, buildLink } from "./buildLink";
import { HREF_TARGET } from "../consts";
import { LinkProps, Source } from "../types/types";

export function goTo(link: string) {
  window.open(link, HREF_TARGET);
}

export function goToLinkProps(linkProps: LinkProps, targets: Targets) {
  const link = buildLink(linkProps, targets);
  window.open(link, HREF_TARGET);
}

export function goToSource(source: Source, targets: Targets) {
  return goTo(buildLinkFromSource(source, targets));
}
