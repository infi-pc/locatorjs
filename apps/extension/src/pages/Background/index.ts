import browser from '../../browser';
import { ensureExtensionStorageReady } from '../../storageContract';
import {
  clearTabReloadRequirement,
  recordExtensionUpdate,
} from '../../extensionUpdateState';

browser.runtime.onInstalled.addListener((details) => {
  void ensureExtensionStorageReady().catch(() => undefined);
  void recordExtensionUpdate(details.reason).catch(() => undefined);
  if (details.reason !== 'install') return;
  browser.tabs.create({
    url: browser.runtime.getURL('onboarding.html'),
  });
});

browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    void clearTabReloadRequirement(tabId).catch(() => undefined);
  }
});

browser.tabs.onRemoved.addListener((tabId) => {
  void clearTabReloadRequirement(tabId).catch(() => undefined);
});
