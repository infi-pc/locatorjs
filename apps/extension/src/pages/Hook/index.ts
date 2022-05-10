import { installReactDevtoolsHook } from './devtoolsHook/installReactDevtoolsHook';
import { Renderer } from '@locator/types';

installReactDevtoolsHook();

const locatorClientUrl = document.documentElement.dataset.locatorClientUrl;
window.setTimeout(() => {
  if (!locatorClientUrl) {
    throw new Error('Locator client url not found');
  }
  const renderers = getRenderers();
  if (renderers.length) {
    insertScript(locatorClientUrl);
  } else {
    console.log('[locatorjs]: No renderers found');
  }
}, 1000);

function insertScript(locatorClientUrl: string) {
  const script = document.createElement('script');
  script.src = locatorClientUrl;
  if (document.head) {
    document.head.appendChild(script);
    if (script.parentNode) {
      script.parentNode.removeChild(script);
      // TODO maybe add back
      // delete document.documentElement.dataset.locatorClientUrl;
    }
  }
}

function getRenderers(): Renderer[] {
  const renderersMap = window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers;
  if (renderersMap) {
    return Array.from(renderersMap.values());
  }
  return [];
}
