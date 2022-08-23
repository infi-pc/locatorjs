import reactAdapter from "./react/reactAdapter";
import jsxAdapter from "./jsx/jsxAdapter";
import svelteAdapter from "./svelte/svelteAdapter";

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

  return (
    (reactAdapter.getTree && reactAdapter.getTree(target)) ||
    (svelteAdapter.getTree && svelteAdapter.getTree(target)) ||
    (jsxAdapter.getTree && jsxAdapter.getTree(target))
  );
}
