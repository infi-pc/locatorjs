import { readPageStatus, type PageStatus } from '@locator/shared';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  CLIENT_SCRIPT_CLASS,
  NO_FRAMEWORK_GRACE_MS,
  REPROBE_DEBOUNCE_MS,
  startPageAgent,
  type PageAgent,
} from './pageAgent';

const CLIENT_URL = 'chrome-extension://locator/client.bundle.js';

let agent: PageAgent | undefined;
let postMessage: ReturnType<typeof vi.spyOn>;

function status(): PageStatus | null {
  return readPageStatus(document);
}

function pageMessage(data: Record<string, unknown>) {
  window.dispatchEvent(
    new MessageEvent('message', {
      source: window,
      data,
      origin: location.origin,
    })
  );
}

function settingsRequests() {
  return postMessage.mock.calls.filter(
    ([data]) =>
      (data as { type?: string })?.type === 'LOCATOR_RUNTIME_SETTINGS_REQUEST'
  ).length;
}

function clientScript() {
  return document.querySelector<HTMLScriptElement>(
    `script.${CLIENT_SCRIPT_CLASS}`
  );
}

function mountJsxApp() {
  document.body.innerHTML = '<div data-locatorjs-id="src/App.tsx::1">Hi</div>';
}

function mountProductionReact() {
  const root = document.createElement('div');
  (root as unknown as Record<string, unknown>)['__reactFiber$abc'] = {
    tag: 5,
  };
  document.body.appendChild(root);
}

beforeEach(() => {
  vi.useFakeTimers();
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  delete document.documentElement.dataset.locatorPageStatus;
  document.documentElement.dataset.locatorClientUrl = CLIENT_URL;
  postMessage = vi
    .spyOn(window, 'postMessage')
    .mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  agent?.stop();
  agent = undefined;
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('startPageAgent', () => {
  test('loads the client once the page has a framework and settings allow it', () => {
    mountJsxApp();
    agent = startPageAgent();

    expect(status()).toEqual({ kind: 'probing' });
    expect(settingsRequests()).toBe(1);
    expect(clientScript()).toBeNull();

    pageMessage({ type: 'LOCATOR_RUNTIME_SETTINGS_READY', disabled: false });
    const script = clientScript();
    expect(script?.src).toBe(CLIENT_URL);
    expect(status()).toEqual({ kind: 'probing' });

    script!.dispatchEvent(new Event('load'));
    expect(status()).toEqual({
      kind: 'ready',
      adapter: 'jsx',
      frameworks: ['jsx'],
    });
  });

  test('stays disabled until the settings change, then loads without a reload', () => {
    mountJsxApp();
    agent = startPageAgent();
    pageMessage({ type: 'LOCATOR_RUNTIME_SETTINGS_READY', disabled: true });

    expect(status()).toEqual({ kind: 'disabled' });
    expect(clientScript()).toBeNull();

    pageMessage({ type: 'LOCATOR_RUNTIME_SETTINGS_READY', disabled: false });
    expect(clientScript()).not.toBeNull();
  });

  test('reports a blocked client and retries on a probe request', () => {
    mountJsxApp();
    agent = startPageAgent();
    pageMessage({ type: 'LOCATOR_RUNTIME_SETTINGS_READY', disabled: false });

    clientScript()!.dispatchEvent(new Event('error'));
    const failed = status();
    expect(failed?.kind).toBe('client-failed');
    expect(failed?.kind === 'client-failed' && failed.detail).toContain(
      CLIENT_URL
    );
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(clientScript()).toBeNull();

    pageMessage({ type: 'LOCATOR_PAGE_PROBE_REQUEST' });
    expect(clientScript()).not.toBeNull();
    expect(status()).toEqual({ kind: 'probing' });
  });

  test('a rendered page without a framework is reported after the grace period', () => {
    document.body.innerHTML = '<app-root ng-version="18.0.0">Hi</app-root>';
    agent = startPageAgent();

    expect(status()).toEqual({ kind: 'probing' });
    vi.advanceTimersByTime(NO_FRAMEWORK_GRACE_MS);
    expect(status()).toEqual({
      kind: 'no-framework',
      unsupported: ['Angular'],
    });
    expect(settingsRequests()).toBe(0);
  });

  test('an empty body keeps probing rather than concluding anything', () => {
    agent = startPageAgent();
    vi.advanceTimersByTime(NO_FRAMEWORK_GRACE_MS * 2);
    expect(status()).toEqual({ kind: 'probing' });
  });

  test('a framework without source metadata is not a missing framework', () => {
    mountProductionReact();
    agent = startPageAgent();
    vi.advanceTimersByTime(NO_FRAMEWORK_GRACE_MS);

    expect(status()).toEqual({ kind: 'no-source-info', frameworks: ['react'] });
    expect(clientScript()).toBeNull();
  });

  test('picks up an app that renders after the first probe', async () => {
    agent = startPageAgent();
    expect(settingsRequests()).toBe(0);

    mountJsxApp();
    await vi.advanceTimersByTimeAsync(REPROBE_DEBOUNCE_MS);

    expect(settingsRequests()).toBe(1);
  });

  test('waits for DOMContentLoaded on a document that is still loading', () => {
    mountJsxApp();
    const readyState = vi
      .spyOn(document, 'readyState', 'get')
      .mockReturnValue('loading');
    agent = startPageAgent();
    expect(settingsRequests()).toBe(0);

    readyState.mockReturnValue('interactive');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    expect(settingsRequests()).toBe(1);
  });

  test('stops watching the DOM once the client is running', async () => {
    mountJsxApp();
    agent = startPageAgent();
    pageMessage({ type: 'LOCATOR_RUNTIME_SETTINGS_READY', disabled: false });
    clientScript()!.dispatchEvent(new Event('load'));

    document.body.appendChild(document.createElement('p'));
    await vi.advanceTimersByTimeAsync(REPROBE_DEBOUNCE_MS * 2);

    expect(status()).toEqual({
      kind: 'ready',
      adapter: 'jsx',
      frameworks: ['jsx'],
    });
    expect(
      document.querySelectorAll(`script.${CLIENT_SCRIPT_CLASS}`)
    ).toHaveLength(1);
  });
});
