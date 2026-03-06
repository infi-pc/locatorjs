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
 * 异步版本的 getElementInfo
 * 当同步方式无法获取 source 时，尝试通过 source-map 解析
 * 目前仅支持 React adapter
 */
export async function getElementInfoAsync(
  target: HTMLElement,
  adapterId?: AdapterId
): Promise<FullElementInfo | null> {
  // 先尝试同步方式
  const syncResult = getElementInfo(target, adapterId);
  if (syncResult && syncResult.thisElement.link) {
    return syncResult;
  }

  // 同步方式无法获取 link，尝试异步方式（仅 React）
  if (adapterId === "react" || !adapterId) {
    const asyncResult = await getReactElementInfoAsync(target);
    if (asyncResult && asyncResult.thisElement.link) {
      return asyncResult;
    }
    // 如果异步也没有获取到 link，返回同步结果（至少有元素信息）
    return asyncResult || syncResult;
  }

  return syncResult;
}
