import reactAdapter, { getElementInfoAsync as getReactElementInfoAsync } from "./react/reactAdapter";
import jsxAdapter from "./jsx/jsxAdapter";
import svelteAdapter from "./svelte/svelteAdapter";
import vueAdapter from "./vue/vueAdapter";
import { AdapterId } from "../consts";
import { FullElementInfo } from "./adapterApi";

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

/**
 * Async version of getElementInfo
 * When sync cannot get source, try source-map resolution
 * Currently only supports React adapter
 */
export async function getElementInfoAsync(
  target: HTMLElement,
  adapterId?: AdapterId
): Promise<FullElementInfo | null> {
  // Try synchronous method first
  const syncResult = getElementInfo(target, adapterId);
  if (syncResult && syncResult.thisElement.link) {
    return syncResult;
  }

  // Sync failed to get link, try async (React only)
  if (adapterId === "react" || !adapterId) {
    const asyncResult = await getReactElementInfoAsync(target);
    if (asyncResult && asyncResult.thisElement.link) {
      return asyncResult;
    }
    // If async also failed, return sync result (at least has element info)
    return asyncResult || syncResult;
  }

  return syncResult;
}
