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
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.from !== 'content' || message.subject !== 'documentOrigin') {
    return false;
  }
  const senderId = (sender as { id?: string }).id;
  if (senderId !== browser.runtime.id) {
    sendResponse({ origin: null });
    return false;
  }
  if (
    typeof sender.tab?.id !== 'number' ||
    typeof sender.frameId !== 'number'
  ) {
    sendResponse({ origin: null });
    return false;
  }
  void getOriginAccess(sender.origin).then(
    (access) => sendResponse({ origin: access.origin, access }),
    () => sendResponse({ origin: null })
  );
  // Keep the response channel open in Chromium versions that ignore Promises.
  return true;
});

browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    void clearTabReloadRequirement(tabId).catch(() => undefined);
  }
});

browser.tabs.onRemoved.addListener((tabId) => {
  void clearTabReloadRequirement(tabId).catch(() => undefined);
});
