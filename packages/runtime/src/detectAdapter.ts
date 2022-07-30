import { AdapterId } from "./consts";

export function detectAdapter(): AdapterId {
  if (document.querySelector("[data-locatorjs-id]")) {
    return "jsx";
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (window.__SVELTE_HMR) {
    // __SVELTE_HMR is so far the only way to detect svelte I found
    return "svelte";
  }

  return "reactDevTools";
}
