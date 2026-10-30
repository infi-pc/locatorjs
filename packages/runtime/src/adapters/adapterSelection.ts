import { chooseAdapter, probePage } from "@locator/shared";
import type { AdapterId } from "../consts";
import type { AdapterObject } from "./adapterApi";
import { getShadowRoots } from "../functions/shadowRoots";
import reactAdapter from "./react/reactAdapter";
import svelteAdapter from "./svelte/svelteAdapter";
import vueAdapter from "./vue/vueAdapter";
import jsxAdapter from "./jsx/jsxAdapter";

const adapters: Record<AdapterId, AdapterObject> = {
  react: reactAdapter,
  svelte: svelteAdapter,
  vue: vueAdapter,
  jsx: jsxAdapter,
};

function isAdapterId(value: string): value is AdapterId {
  return Object.prototype.hasOwnProperty.call(adapters, value);
}

/**
 * The adapter in effect: a fixed setting wins, otherwise whatever the page
 * probe finds dev-mode source metadata for. Null when there is nothing usable.
 */
export function resolveAdapterId(adapterId?: string): AdapterId | null {
  if (adapterId && isAdapterId(adapterId)) return adapterId;
  return chooseAdapter(probePage(document, { roots: getShadowRoots() }));
}

/** Selects an explicitly requested adapter or the first detected one. */
export function getAdapter(adapterId?: string): AdapterObject | null {
  const resolved = resolveAdapterId(adapterId);
  return resolved ? adapters[resolved] : null;
}
