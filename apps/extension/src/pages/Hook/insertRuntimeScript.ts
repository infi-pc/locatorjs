import { isValidRenderer } from '@locator/shared/dist/isValidRenderer';
import { detectSvelte, detectVue } from '@locator/shared';

type Renderer = any;

export function insertRuntimeScript() {
  let scriptLoaded = false;
  let attemptsNecessaryToShowError = 4; // but not necessarily all attempts, we want to show loading for a while

  const locatorClientUrl = document.documentElement.dataset.locatorClientUrl;
  delete document.documentElement.dataset.locatorClientUrl;

  function sendStatusMessage(message: string) {
    document.head.dataset.locatorHookStatusMessage = message;
    // eslint-disable-next-line no-console
    console.warn(`[locatorjs]: ${message}`);
  }

  document.addEventListener('DOMContentLoaded', loadedHandler);
  setTimeout(loadedHandler, 1000);
  setTimeout(loadedHandler, 2000);
  setTimeout(loadedHandler, 5000);
  setTimeout(loadedHandler, 8000);
  setTimeout(loadedHandler, 12000);

  function loadedHandler() {
    if (scriptLoaded) {
      return;
    }
    attemptsNecessaryToShowError--;
    const msg = tryToInsertScript();

    if (attemptsNecessaryToShowError <= 0) {
      sendStatusMessage(msg);
    } else {
      sendStatusMessage(msg === 'ok' ? 'ok' : `loading: ${msg}`);
    }
  }

  function tryToInsertScript(): string {
    if (!locatorClientUrl) {
      return 'Locator client url not found';
    }

    if (detectSvelte() || detectVue()) {
      const inserted = insertScript(locatorClientUrl);
      if (inserted) {
        scriptLoaded = true;
        return 'ok';
      }
    }

    // JSX adapter
    if (document.querySelector('[data-locatorjs-id]')) {
      const inserted = insertScript(locatorClientUrl);
      if (inserted) {
        scriptLoaded = true;
        return 'ok';
      }
    }

    // React Devtools hook
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
        const inserted = insertScript(locatorClientUrl);
        if (inserted) {
          scriptLoaded = true;
          return 'ok';
        } else {
          return `Could not insert script`;
        }
      } else {
        if (problematicRenderers.length) {
          return problematicRenderers.join('\n');
        } else {
          return 'No valid renderers found.';
        }
      }
    } else {
      return 'React devtools hook was not found. It can be caused by collision with other extension using devtools hook.';
    }
  }
}

function insertScript(locatorClientUrl: string) {
  const script = document.createElement('script');
  script.className = 'locatorjs-extension-script';
  script.src = locatorClientUrl;

  if (document.head) {
    document.head.appendChild(script);
    // TODO: cleanup would be nice, but cuttently we need to keep the script to check it it was loaded from extension
    // if (script.parentNode) {
    //   script.parentNode.removeChild(script);
    //   // TODO maybe add back
    //   // delete document.documentElement.dataset.locatorClientUrl;
    // }
    const foundIFrames = document.getElementsByTagName('iframe');

    for (const iframe of foundIFrames) {
      try {
        const script = document.createElement('script');
        script.src = locatorClientUrl;
        script.className = 'locatorjs-extension-script';
        iframe.contentWindow?.document.head.appendChild(script);
      } catch (e) {
        // Fail silently, in most cases it will be cross-origin, and we don't need Locator there.
      }
    }
    return true;
  }
  return false;
}
