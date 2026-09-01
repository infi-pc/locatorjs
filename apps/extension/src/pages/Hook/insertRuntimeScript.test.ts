// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { insertRuntimeScript } from './insertRuntimeScript';

describe('insertRuntimeScript', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.head.innerHTML = '';
    document.body.innerHTML = '<div data-locatorjs-id="fixture"></div>';
    document.documentElement.dataset.locatorClientUrl =
      'chrome-extension://locator/client.bundle.js';
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  test('reports a client load failure and leaves the URL available to retry', () => {
    insertRuntimeScript();
    document.dispatchEvent(new Event('DOMContentLoaded'));
    window.dispatchEvent(
      new MessageEvent('message', {
        source: window,
        data: { type: 'LOCATOR_RUNTIME_SETTINGS_READY', disabled: false },
      })
    );

    const script = document.querySelector<HTMLScriptElement>(
      'script.locatorjs-extension-script'
    );
    expect(script).not.toBeNull();
    script!.dispatchEvent(new Event('error'));

    expect(document.head.dataset.locatorHookStatusMessage).toContain(
      'failed to load'
    );
    expect(document.documentElement.dataset.locatorClientUrl).toContain(
      'client.bundle.js'
    );
    expect(script!.isConnected).toBe(false);
  });
});
