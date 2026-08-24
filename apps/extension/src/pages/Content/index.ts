import browser from '../../browser';
import { migrateLegacyExtensionStorage } from './migrateLegacyExtensionStorage';
import { mountSnapshotBridge } from './snapshotBridge';
import {
  USER_OPTIONS_KEY,
  decodeStoredUserOptions,
  readUserOptions,
} from '../../storageContract';
import { postMessageOrigin, type LocatorOptions } from '@locator/shared';
import { safeFrameProjection } from './settingsProjection';

let latestOptions: LocatorOptions = {};
let fullSettingsRequested = false;
let initialOptionsReady = false;
let pendingSettingsRequest = false;

// The migration writes `userOptions`, so the first read waits for it. Reading
// in parallel would race a v1 user's settings against their own upgrade.
migrateLegacyExtensionStorage()
  .then(() => readUserOptions())
  .then((options) => {
    initialOptionsReady = true;
    publishUserExtensionOptions(options);
    if (pendingSettingsRequest) respondToSettingsRequest();
  })
  .catch(() => undefined);

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') return;
  if (!(USER_OPTIONS_KEY in changes)) return;

  const newOptions = decodeStoredUserOptions(
    changes[USER_OPTIONS_KEY].newValue
  );
  publishUserExtensionOptions(newOptions);
});

window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (event.data?.type !== 'LOCATOR_RUNTIME_SETTINGS_REQUEST') return;
  if (!initialOptionsReady) {
    pendingSettingsRequest = true;
    return;
  }
  respondToSettingsRequest();
});

function respondToSettingsRequest() {
  pendingSettingsRequest = false;
  if (!latestOptions.disabled) fullSettingsRequested = true;
  injectUserExtensionGlobal(latestOptions);
  window.postMessage(
    {
      type: 'LOCATOR_RUNTIME_SETTINGS_READY',
      disabled: latestOptions.disabled === true,
    },
    postMessageOrigin(window.location)
  );
}

function publishUserExtensionOptions(options: LocatorOptions) {
  latestOptions = options;
  injectUserExtensionGlobal(options);
}

function injectUserExtensionGlobal(options: LocatorOptions) {
  withDocumentElement((element) => {
    const canReceiveEditor = canReceiveFullSettings();
    element.dataset.locatorEditorWithheld = canReceiveEditor ? 'false' : 'true';
    element.dataset.locatorUserExtensionOptions = JSON.stringify(
      fullSettingsRequested && canReceiveEditor && !options.disabled
        ? options
        : safeFrameProjection(options)
    );
  });
}

function canReceiveFullSettings(): boolean {
  if (window === window.top) return true;
  try {
    return window.top?.location.origin === window.location.origin;
  } catch {
    return false;
  }
}

function withDocumentElement(callback: (element: HTMLElement) => void) {
  const element = document.documentElement;
  if (element) {
    callback(element);
    return;
  }

  const observer = new MutationObserver(() => {
    const nextElement = document.documentElement;
    if (!nextElement) return;
    observer.disconnect();
    callback(nextElement);
  });
  observer.observe(document, { childList: true });
}

function publishClientUrl() {
  withDocumentElement((element) => {
    element.dataset.locatorClientUrl =
      browser.runtime.getURL('/client.bundle.js');
  });
}

switch (document.contentType) {
  case 'text/html':
  case 'application/xhtml+xml': {
    // hook.bundle.js is declared as a MAIN-world document_start script. The
    // isolated content script only publishes the extension URL it cannot read
    // itself; the hook consumes it when the page is ready for runtime mounting.
    publishClientUrl();
    break;
  }
}

mountSnapshotBridge();
