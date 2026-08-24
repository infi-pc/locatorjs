import browser from '../../browser';
import { ensureExtensionStorageReady } from '../../storageContract';

browser.runtime.onInstalled.addListener((details) => {
  void ensureExtensionStorageReady().catch(() => undefined);
  if (details.reason !== 'install') return;
  browser.tabs.create({
    url: browser.runtime.getURL('onboarding.html'),
  });
});
