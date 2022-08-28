import reactAdapter from "./react/reactAdapter";
import jsxAdapter from "./jsx/jsxAdapter";
import svelteAdapter from "./svelte/svelteAdapter";
import { detectJSX, detectReact, detectSvelte } from "@locator/shared";

export function getTree(target: HTMLElement, adapterId?: string) {
  if (adapterId === "react" && reactAdapter.getTree) {
    return reactAdapter.getTree(target);
  }
  if (adapterId === "svelte" && svelteAdapter.getTree) {
    return svelteAdapter.getTree(target);
  }
  if (adapterId === "jsx" && jsxAdapter.getTree) {
    return jsxAdapter.getTree(target);
  }

  if (detectSvelte() && svelteAdapter.getTree) {
    return svelteAdapter.getTree(target);
  }

  if (detectJSX() && jsxAdapter.getTree) {
    return jsxAdapter.getTree(target);
  }

  if (detectReact() && reactAdapter.getTree) {
    return reactAdapter.getTree(target);
  }

  return null;
}
