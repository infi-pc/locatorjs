import browser from '../../browser';
import { migrateLegacyExtensionStorage } from './migrateLegacyExtensionStorage';
import { mountSnapshotBridge } from './snapshotBridge';
import {
  USER_OPTIONS_KEY,
  decodeStoredUserOptions,
  readUserOptions,
} from '../../storageContract';
import type { Binding, LocatorOptions } from '@locator/shared';

// The migration writes `userOptions`, so the first read waits for it. Reading
// in parallel would race a v1 user's settings against their own upgrade.
migrateLegacyExtensionStorage()
  .then(() => {
    readUserOptions().then((options) => {
      injectUserExtensionGlobal(options);
      window.postMessage(
        {
          type: 'LOCATOR_USER_EXTENSION_OPTIONS_UPDATED',
          options,
        },
        window.location.origin
      );
    });
  })
  .catch(() => undefined);

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') return;
  if (!(USER_OPTIONS_KEY in changes)) return;

  const newOptions = decodeStoredUserOptions(
    changes[USER_OPTIONS_KEY].newValue
  );
  injectUserExtensionGlobal(newOptions);
  window.postMessage(
    {
      type: 'LOCATOR_USER_EXTENSION_OPTIONS_UPDATED',
      options: newOptions,
    },
    window.location.origin
  );
});

function injectUserExtensionGlobal(options: LocatorOptions) {
  withDocumentElement((element) => {
    element.dataset.locatorUserExtensionOptions = JSON.stringify(
      canReceiveFullSettings() ? options : safeFrameProjection(options)
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

/** Never expose editor URLs, project paths, sessions, or prompt text cross-origin. */
export function safeFrameProjection(options: LocatorOptions): LocatorOptions {
  const bindings = options.bindings?.flatMap((binding): Binding[] => {
    const trigger = binding.trigger;
    switch (binding.action.kind) {
      case 'open-editor':
        return [{ trigger, action: { kind: 'open-editor' } }];
      case 'copy-path':
      case 'show-tree':
      case 'show-parents':
        return [{ trigger, action: { kind: binding.action.kind } }];
      case 'copy-prompt':
      case 'open-prompt':
        return [];
    }
  });
  return {
    bindings,
    disabled: options.disabled,
    hrefTarget: options.hrefTarget,
    showIntro: options.showIntro,
    adapterId: options.adapterId,
  };
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
