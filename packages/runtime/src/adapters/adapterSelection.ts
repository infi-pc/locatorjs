import {
  detectJSX,
  detectReact,
  detectSvelte,
  detectVue,
} from "@locator/shared";
import type { AdapterObject } from "./adapterApi";
import reactAdapter from "./react/reactAdapter";
import svelteAdapter from "./svelte/svelteAdapter";
import vueAdapter from "./vue/vueAdapter";
import jsxAdapter from "./jsx/jsxAdapter";

const adapters = {
  react: reactAdapter,
  svelte: svelteAdapter,
  vue: vueAdapter,
  jsx: jsxAdapter,
};

/** Selects an explicitly requested adapter or the first detected one. */
export function getAdapter(adapterId?: string): AdapterObject | null {
  if (adapterId && Object.prototype.hasOwnProperty.call(adapters, adapterId)) {
    return adapters[adapterId as keyof typeof adapters];
  }

  const detected = [
    [detectSvelte, svelteAdapter],
    [detectVue, vueAdapter],
    [detectReact, reactAdapter],
    [detectJSX, jsxAdapter],
  ] as const;

  return detected.find(([isDetected]) => isDetected())?.[1] ?? null;
}
