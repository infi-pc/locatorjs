import { isValidRenderer } from '@locator/shared/dist/isValidRenderer';
import { detectSvelte, detectVue } from '@locator/shared';

type Renderer = any;

export function insertRuntimeScript() {
  let scriptLoaded = false;
  let attemptsNecessaryToShowError = 4; // but not necessarily all attempts, we want to show loading for a while

  function sendStatusMessage(message: string) {
    if (document.head) {
      document.head.dataset.locatorHookStatusMessage = message;
    }
    // eslint-disable-next-line no-console -- injection failure must be diagnosable from the page console.
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
    const locatorClientUrl = document.documentElement?.dataset.locatorClientUrl;
    if (!locatorClientUrl) {
      return 'Locator client url not found';
    }

    if (detectSvelte() || detectVue()) {
      const inserted = insertScript(locatorClientUrl);
      if (inserted) {
        delete document.documentElement.dataset.locatorClientUrl;
        scriptLoaded = true;
        return 'ok';
      }
    }

    // JSX adapter
    if (document.querySelector('[data-locatorjs-id]')) {
      const inserted = insertScript(locatorClientUrl);
      if (inserted) {
        delete document.documentElement.dataset.locatorClientUrl;
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
          delete document.documentElement.dataset.locatorClientUrl;
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
    // Iframes are handled by the content script itself: the manifest declares
    // `all_frames`, so every frame - cross-origin ones included - runs the hook
    // and inserts the client with the same retry logic as the top document.
    return true;
  }
  return false;
}
