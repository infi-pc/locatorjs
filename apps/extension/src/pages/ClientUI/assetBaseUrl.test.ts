import { describe, expect, it } from 'vitest';
import { assetBaseUrlFromClientUrl } from './assetBaseUrl';

describe('assetBaseUrlFromClientUrl', () => {
  it('uses the extension client bundle directory', () => {
    expect(
      assetBaseUrlFromClientUrl(
        'chrome-extension://extension-id/client.bundle.js'
      )
    ).toBe('chrome-extension://extension-id/');
  });

  it('keeps nested bundle directories', () => {
    expect(
      assetBaseUrlFromClientUrl(
        'moz-extension://extension-id/dist/client.bundle.js'
      )
    ).toBe('moz-extension://extension-id/dist/');
  });

  it('ignores missing or invalid client URLs', () => {
    expect(assetBaseUrlFromClientUrl(undefined)).toBeUndefined();
    expect(assetBaseUrlFromClientUrl('not a URL')).toBeUndefined();
  });
});
