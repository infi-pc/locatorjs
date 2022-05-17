import { isValidRenderer } from '@locator/react-devtools-hook';

type Renderer = any;

export function insertRuntimeScript() {
  const locatorClientUrl = document.documentElement.dataset.locatorClientUrl;

  function sendMessage(message: string) {
    document.head.dataset.locatorMessage = message;
    console.warn(`[locatorjs]: ${message}`);
  }

  window.setTimeout(() => {
    if (!locatorClientUrl) {
      throw new Error('Locator client url not found');
    }
    const renderersMap = window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers;
    if (renderersMap) {
      const problematicRenderers: string[] = [];
      const renderers = Array.from(renderersMap.values()).filter(
        (renderer: Renderer) => {
          return isValidRenderer(renderer, (msg) => {
            problematicRenderers.push(msg);
          });
        }
      );
      if (renderers.length) {
        insertScript(locatorClientUrl);
      } else {
        if (problematicRenderers.length) {
          sendMessage(problematicRenderers.join('\n'));
        } else {
          sendMessage('No valid renderers found.');
        }
      }
    } else {
      sendMessage(
        'React devtools hook was not found. It can be caused by collision with other extension using devtools hook.'
      );
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
}
