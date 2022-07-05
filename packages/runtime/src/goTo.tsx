import { buidLink, buildLinkFromSource } from "./buidLink";
import { HREF_TARGET } from "./consts";
import { Source } from "./types";

export function goTo(link: string) {
  window.open(link, HREF_TARGET);
}

export function goToSource(source: Source) {
  return goTo(buildLinkFromSource(source));
}
