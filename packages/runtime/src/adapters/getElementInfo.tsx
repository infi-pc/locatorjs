import reactAdapter from "./react/reactAdapter";
import jsxAdapter from "./jsx/jsxAdapter";
import svelteAdapter from "./svelte/svelteAdapter";
import vueAdapter from "./vue/vueAdapter";
import { AdapterId } from "../consts";

export function getElementInfo(target: HTMLElement, adapterId?: AdapterId) {
  if (adapterId === "react") {
    return reactAdapter.getElementInfo(target);
  }
  if (adapterId === "svelte") {
    return svelteAdapter.getElementInfo(target);
  }
  if (adapterId === "jsx") {
    return jsxAdapter.getElementInfo(target);
  }
  if (adapterId === "vue") {
    return vueAdapter.getElementInfo(target);
  }

  return (
    jsxAdapter.getElementInfo(target) ||
    reactAdapter.getElementInfo(target) ||
    svelteAdapter.getElementInfo(target) ||
    vueAdapter.getElementInfo(target)
  );
}
