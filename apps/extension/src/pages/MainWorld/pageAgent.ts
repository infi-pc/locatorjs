import {
  chooseAdapter,
  getSharedShadowRoots,
  postMessageOrigin,
  probePage,
  writePageStatus,
  type FrameworkId,
  type PageProbe,
  type PageStatus,
} from '@locator/shared';

/**
 * The page agent runs in the page's own JavaScript world and decides whether
 * this document is something Locator can drive. It samples the DOM for
 * framework dev metadata, asks the content script for the user's settings,
 * loads the client when both allow it, and publishes a `PageStatus` for the
 * popup at every step.
 *
 * It never touches `__REACT_DEVTOOLS_GLOBAL_HOOK__`: creating that global
 * first locks React DevTools out of the page.
 */

/** Coalesces bursts of DOM mutations into one probe. */
export const REPROBE_DEBOUNCE_MS = 500;
/** How long a rendered page gets to show a framework before "no framework". */
export const NO_FRAMEWORK_GRACE_MS = 3_000;
/** Stop watching for late renders after this; the popup can still re-probe. */
const OBSERVE_LIMIT_MS = 90_000;
const SETTINGS_RETRY_MS = 2_000;

/** isExtension() in the runtime identifies the extension by this class. */
export const CLIENT_SCRIPT_CLASS = 'locatorjs-extension-script';

type Settings = { known: false } | { known: true; disabled: boolean };

type ClientState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'loaded'; adapter: FrameworkId }
  | { phase: 'failed'; detail: string };

export type PageAgent = {
  /** Re-sample the page now, e.g. from the popup's "Check again". */
  probeNow(): void;
  status(): PageStatus;
  stop(): void;
};

export function startPageAgent(doc: Document = document): PageAgent {
  const view = doc.defaultView;
  if (!view) {
    return {
      probeNow: () => undefined,
      status: () => current,
      stop: () => undefined,
    };
  }

  let probe: PageProbe | null = null;
  let settings: Settings = { known: false };
  let client: ClientState = { phase: 'idle' };
  let settingsRequestedAt = Number.NEGATIVE_INFINITY;
  let graceOver = false;
  let current: PageStatus = { kind: 'probing' };
  let debounce: ReturnType<typeof setTimeout> | undefined;
  let observer: MutationObserver | undefined;
  let stopped = false;
  const timers = new Set<ReturnType<typeof setTimeout>>();

  function after(ms: number, callback: () => void) {
    const id = setTimeout(() => {
      timers.delete(id);
      if (!stopped) callback();
    }, ms);
    timers.add(id);
  }

  function publish(status: PageStatus) {
    current = status;
    writePageStatus(doc, status);
  }

  function evaluate() {
    if (stopped) return;
    const adapter = probe ? chooseAdapter(probe) : null;
    const frameworks = probe?.frameworks.map((entry) => entry.id) ?? [];

    if (client.phase === 'loaded') {
      publish({ kind: 'ready', adapter: client.adapter, frameworks });
      stopObserving();
      return;
    }
    if (client.phase === 'failed') {
      publish({ kind: 'client-failed', detail: client.detail });
      return;
    }
    if (adapter) {
      if (!settings.known) {
        requestSettings();
        publish({ kind: 'probing' });
        return;
      }
      if (settings.disabled) {
        publish({ kind: 'disabled' });
        return;
      }
      if (client.phase === 'idle') loadClient(adapter);
      publish({ kind: 'probing' });
      return;
    }
    if (probe && probe.frameworks.length > 0) {
      publish({ kind: 'no-source-info', frameworks });
      return;
    }
    if (probe?.rendered && graceOver) {
      publish({ kind: 'no-framework', unsupported: probe.unsupported });
      return;
    }
    publish({ kind: 'probing' });
  }

  function runProbe() {
    if (stopped) return;
    probe = probePage(doc, { roots: getSharedShadowRoots() });
    evaluate();
  }

  function scheduleProbe() {
    if (debounce !== undefined) return;
    debounce = setTimeout(() => {
      debounce = undefined;
      runProbe();
    }, REPROBE_DEBOUNCE_MS);
  }

  function requestSettings(force = false) {
    const now = Date.now();
    if (!force && now - settingsRequestedAt < SETTINGS_RETRY_MS) return;
    settingsRequestedAt = now;
    view!.postMessage(
      { type: 'LOCATOR_RUNTIME_SETTINGS_REQUEST' },
      postMessageOrigin(view!.location)
    );
  }

  function loadClient(adapter: FrameworkId) {
    // The content script publishes the URL once documentElement exists; if it
    // is not there yet, the next probe retries.
    const url = doc.documentElement?.dataset.locatorClientUrl;
    if (!url || !doc.head) return;
    client = { phase: 'loading' };
    const script = doc.createElement('script');
    script.className = CLIENT_SCRIPT_CLASS;
    script.src = url;
    script.addEventListener(
      'load',
      () => {
        client = { phase: 'loaded', adapter };
        evaluate();
      },
      { once: true }
    );
    script.addEventListener(
      'error',
      () => {
        script.remove();
        const detail = `The page did not run ${url}. A strict Content-Security-Policy is the usual cause.`;
        client = { phase: 'failed', detail };
        // eslint-disable-next-line no-console -- a blocked client must be diagnosable from the page console.
        console.warn(`[locatorjs] ${detail}`);
        evaluate();
      },
      { once: true }
    );
    doc.head.appendChild(script);
  }

  function onMessage(event: MessageEvent) {
    if (event.source !== view) return;
    const data = event.data;
    if (!data || typeof data !== 'object') return;
    if (data.type === 'LOCATOR_RUNTIME_SETTINGS_READY') {
      settings = { known: true, disabled: data.disabled === true };
      evaluate();
    } else if (data.type === 'LOCATOR_PAGE_PROBE_REQUEST') {
      probeNow();
    }
  }

  function probeNow() {
    if (stopped) return;
    if (client.phase === 'failed') client = { phase: 'idle' };
    requestSettings(true);
    runProbe();
  }

  function startObserving() {
    const target = doc.documentElement ?? doc;
    observer = new MutationObserver(scheduleProbe);
    observer.observe(target, { childList: true, subtree: true });
    after(OBSERVE_LIMIT_MS, stopObserving);
  }

  function stopObserving() {
    observer?.disconnect();
    observer = undefined;
    if (debounce !== undefined) {
      clearTimeout(debounce);
      debounce = undefined;
    }
  }

  function onDocumentReady() {
    runProbe();
    after(NO_FRAMEWORK_GRACE_MS, () => {
      graceOver = true;
      evaluate();
    });
  }

  view.addEventListener('message', onMessage);
  view.addEventListener('load', runProbe);
  startObserving();
  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', onDocumentReady, { once: true });
  } else {
    onDocumentReady();
  }

  return {
    probeNow,
    status: () => current,
    stop() {
      stopped = true;
      stopObserving();
      for (const id of timers) clearTimeout(id);
      timers.clear();
      view.removeEventListener('message', onMessage);
      view.removeEventListener('load', runProbe);
      doc.removeEventListener('DOMContentLoaded', onDocumentReady);
    },
  };
}
