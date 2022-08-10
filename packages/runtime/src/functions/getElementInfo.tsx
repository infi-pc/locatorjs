import reactAdapter from "./../adapters/react/reactAdapter";
import jsxAdapter from "./../adapters/jsx/jsxAdapter";
import svelteAdapter from "./../adapters/svelte/svelteAdapter";

export function getElementInfo(target: HTMLElement, adapterId?: string) {
  if (adapterId === "react") {
    return reactAdapter.getElementInfo(target);
  }
  if (adapterId === "svelte") {
    return svelteAdapter.getElementInfo(target);
  }
  if (adapterId === "jsx") {
    return jsxAdapter.getElementInfo(target);
  }

  return (
    reactAdapter.getElementInfo(target) ||
    svelteAdapter.getElementInfo(target) ||
    jsxAdapter.getElementInfo(target)
  );
}
