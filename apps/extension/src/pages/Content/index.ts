import browser from '../../browser';
import { cleanupLegacyExtensionStorage } from './cleanupLegacyExtensionStorage';
import { mountSnapshotBridge } from './snapshotBridge';

const USER_OPTIONS_KEY = 'userOptions';

cleanupLegacyExtensionStorage();

browser.storage.local.get([USER_OPTIONS_KEY], (result) => {
  const options = result?.[USER_OPTIONS_KEY] ?? {};
  injectUserExtensionGlobal(options);
});

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') return;
  if (!(USER_OPTIONS_KEY in changes)) return;

  const newOptions = changes[USER_OPTIONS_KEY].newValue ?? {};
  injectUserExtensionGlobal(newOptions);
  window.postMessage(
    {
      type: 'LOCATOR_USER_EXTENSION_OPTIONS_UPDATED',
      options: newOptions,
    },
    '*'
  );
});

function injectUserExtensionGlobal(options: unknown) {
  const script = document.createElement('script');
  script.textContent = `window.__LOCATOR_USER_EXTENSION_OPTIONS__ = ${JSON.stringify(
    options
  )};`;
  const parent = document.head || document.documentElement;
  if (parent) {
    parent.appendChild(script);
    script.remove();
  }
}

function injectClientHook() {
  const script = document.createElement('script');
  script.src = browser.runtime.getURL('/hook.bundle.js');

  document.documentElement.dataset.locatorClientUrl =
    browser.runtime.getURL('/client.bundle.js');

  if (document.documentElement) {
    document.documentElement.appendChild(script);
    if (script.parentNode) {
      script.parentNode.removeChild(script);
    }
  }
}

switch (document.contentType) {
  case 'text/html':
  case 'application/xhtml+xml': {
    injectClientHook();
    break;
  }
}

mountSnapshotBridge();
