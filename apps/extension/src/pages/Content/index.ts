import browser from '../../browser';
import { migrateLegacyExtensionStorage } from './migrateLegacyExtensionStorage';
import { mountSnapshotBridge } from './snapshotBridge';
import {
  USER_CONFIG_KEY,
  decodeStoredExtensionConfig,
  layerFromRead,
  readExtensionConfig,
} from '../../storageContract';
import {
  postMessageOrigin,
  type strictConfig as StrictConfig,
} from '@locator/shared';
import { safeFrameProjection } from './settingsProjection';

let latestLayer: StrictConfig.SerializedLayerV3 = {};
let fullSettingsRequested = false;
let initialOptionsReady = false;
let pendingSettingsRequest = false;

migrateLegacyExtensionStorage()
  .then(() => readExtensionConfig())
  .then((read) => {
    initialOptionsReady = true;
    publishUserExtensionLayer(layerFromRead(read));
    if (pendingSettingsRequest) respondToSettingsRequest();
  })
  .catch(() => undefined);

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local' || !(USER_CONFIG_KEY in changes)) return;
  const read = decodeStoredExtensionConfig(changes[USER_CONFIG_KEY].newValue);
  publishUserExtensionLayer(layerFromRead(read));
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
  if (!latestLayer.disabled) fullSettingsRequested = true;
  injectUserExtensionGlobal(latestLayer);
  window.postMessage(
    {
      type: 'LOCATOR_RUNTIME_SETTINGS_READY',
      disabled: latestLayer.disabled === true,
    },
    postMessageOrigin(window.location)
  );
}

function publishUserExtensionLayer(layer: StrictConfig.SerializedLayerV3) {
  latestLayer = layer;
  injectUserExtensionGlobal(layer);
}

function injectUserExtensionGlobal(layer: StrictConfig.SerializedLayerV3) {
  withDocumentElement((element) => {
    const canReceiveEditor = canReceiveFullSettings();
    element.dataset.locatorEditorWithheld = canReceiveEditor ? 'false' : 'true';
    element.dataset.locatorUserExtensionOptions = JSON.stringify(
      fullSettingsRequested && canReceiveEditor && !layer.disabled
        ? layer
        : safeFrameProjection(layer)
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
    publishClientUrl();
    break;
  }
}

mountSnapshotBridge();
