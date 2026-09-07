import browser from '../../browser';
import { getOriginAccess } from '../../originAccess';
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

// This listener is deliberately registered before any storage initialization.
// The browser supplies the authenticated document origin; page-world fields
// and sender URLs are never used as fallbacks.
browser.runtime.onMessage.addListener((message, sender) => {
  if (message?.from !== 'content' || message.subject !== 'documentOrigin') {
    return false;
  }
  const senderId = (sender as { id?: string }).id;
  if (senderId !== browser.runtime.id) {
    return { origin: null };
  }
  if (
    typeof sender.tab?.id !== 'number' ||
    typeof sender.frameId !== 'number'
  ) {
    return { origin: null };
  }
  return getOriginAccess(sender.origin).then((access) => ({
    origin: access.origin,
    access,
  }));
});

browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    void clearTabReloadRequirement(tabId).catch(() => undefined);
  }
});

browser.tabs.onRemoved.addListener((tabId) => {
  void clearTabReloadRequirement(tabId).catch(() => undefined);
});
