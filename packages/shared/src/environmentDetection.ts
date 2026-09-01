import { isValidRenderer } from "./isValidRenderer";

export function detectSvelte() {
  // @ts-expect-error -- Svelte exposes these development-only globals.
  return Boolean(window.__SVELTE_HMR || window.__SAPPER__);
}

export function detectVue() {
  // @ts-expect-error -- Vue exposes this development-only global.
  return Boolean(window.__VUE__);
}

export function detectJSX() {
  // @ts-expect-error -- Locator's JSX transform exposes this runtime store.
  return Boolean(window.__LOCATOR_DATA__);
}

export function detectReact() {
  // @ts-expect-error -- React DevTools exposes this development-only global.
  const renderersMap = window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers;
  if (!renderersMap) return false;

  const problematicRenderers: string[] = [];
  const renderers = Array.from(renderersMap.values()).filter((renderer: any) =>
    isValidRenderer(renderer, (message) => {
      problematicRenderers.push(message);
    })
  );
  return renderers.length > 0;
}
