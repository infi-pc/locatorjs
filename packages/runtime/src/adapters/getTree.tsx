import reactAdapter from "./react/reactAdapter";
import jsxAdapter from "./jsx/jsxAdapter";
import svelteAdapter from "./svelte/svelteAdapter";

export function getTree(target: HTMLElement, adapterId?: string) {
  if (adapterId === "react") {
    return reactAdapter.getTree(target);
  }
  if (adapterId === "svelte") {
    return svelteAdapter.getTree(target);
  }
  if (adapterId === "jsx") {
    return jsxAdapter.getTree(target);
  }

  return (
    reactAdapter.getTree(target) ||
    svelteAdapter.getTree(target) ||
    jsxAdapter.getTree(target)
  );
}
