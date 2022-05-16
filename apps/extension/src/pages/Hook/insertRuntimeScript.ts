import { isValidRenderer } from '@locator/react-devtools-hook';

type Renderer = any;

export function insertRuntimeScript() {
  const locatorClientUrl = document.documentElement.dataset.locatorClientUrl;
  window.setTimeout(() => {
    if (!locatorClientUrl) {
      throw new Error('Locator client url not found');
    }
    const renderers = getValidRenderers();
    if (renderers.length) {
      insertScript(locatorClientUrl);
    } else {
      // console.log('[locatorjs]: No renderers found');
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

  function getValidRenderers(): Renderer[] {
    const renderersMap = window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers;
    if (renderersMap) {
      return Array.from(renderersMap.values()).filter((renderer: Renderer) => {
        return isValidRenderer(renderer);
      });
    }
    return [];
  }
}
