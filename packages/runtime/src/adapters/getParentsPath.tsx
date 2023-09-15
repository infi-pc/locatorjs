import reactAdapter from "./react/reactAdapter";
import { detectReact } from "@locator/shared";
import { ParentPathItem } from "./adapterApi";

export function getParentsPaths(
  target: HTMLElement,
  adapterId?: string
): ParentPathItem[] {
  if (adapterId === "react" && reactAdapter.getParentsPaths) {
    return reactAdapter.getParentsPaths(target);
  }
  // if (adapterId === "svelte" && svelteAdapter.getTree) {
  //   return svelteAdapter.getTree(target);
  // }
  // if (adapterId === "vue" && vueAdapter.getTree) {
  //   return vueAdapter.getTree(target);
  // }
  // if (adapterId === "jsx" && jsxAdapter.getTree) {
  //   return jsxAdapter.getTree(target);
  // }

  // if (detectSvelte() && svelteAdapter.getTree) {
  //   return svelteAdapter.getTree(target);
  // }

  // if (detectVue() && vueAdapter.getTree) {
  //   return vueAdapter.getTree(target);
  // }

  if (detectReact() && reactAdapter.getParentsPaths) {
    return reactAdapter.getParentsPaths(target);
  }

  // // Must be last, because its global data leaks from Locator extension.
  // // Because the extension is in SolidJS and it uses JSX plugin in dev mode.
  // if (detectJSX() && jsxAdapter.getTree) {
  //   return jsxAdapter.getTree(target);
  // }

  return [];
}
