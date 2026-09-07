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
import type { OriginAccess } from '../../originAccess';

let latestLayer: StrictConfig.SerializedLayerV3 = {};
let initialOptionsReady = false;
let documentOriginReady = false;
let pendingSettingsRequest = false;
let currentAccess: OriginAccess = { origin: null, reason: 'unavailable' };
let accessRequest = 0;

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') return;
  if (USER_CONFIG_KEY in changes) {
    const read = decodeStoredExtensionConfig(changes[USER_CONFIG_KEY].newValue);
    publishUserExtensionLayer(layerFromRead(read));
  }
  if (
    currentAccess.origin
      ? `trustedOrigin:${currentAccess.origin}` in changes
      : Object.keys(changes).some((key) => key.startsWith('trustedOrigin:'))
  ) {
    void refreshOriginAccess();
  }
});

async function refreshOriginAccess() {
  const request = ++accessRequest;
  // Stop sharing while a changed grant is being checked.
  if (currentAccess.reason === 'approved') {
    currentAccess = {
      origin: currentAccess.origin,
      reason: 'approval-required',
    };
    injectUserExtensionGlobal(latestLayer);
  }
  const response: { access?: OriginAccess } | undefined = await browser.runtime
    .sendMessage({ from: 'content', subject: 'documentOrigin' })
    .catch(() => undefined);
  if (request !== accessRequest) return;
  currentAccess = response?.access ?? { origin: null, reason: 'unavailable' };
  documentOriginReady = true;
  injectUserExtensionGlobal(latestLayer);
  if (initialOptionsReady && pendingSettingsRequest) respondToSettingsRequest();
}

void refreshOriginAccess();

migrateLegacyExtensionStorage()
  .then(() => readExtensionConfig())
  .then((read) => {
    initialOptionsReady = true;
    publishUserExtensionLayer(layerFromRead(read));
    if (pendingSettingsRequest && documentOriginReady)
      respondToSettingsRequest();
  })
  .catch(() => {
    initialOptionsReady = true;
    publishUserExtensionLayer({});
    if (pendingSettingsRequest && documentOriginReady)
      respondToSettingsRequest();
  });

window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (event.data?.type !== 'LOCATOR_RUNTIME_SETTINGS_REQUEST') return;
  if (!initialOptionsReady || !documentOriginReady) {
    pendingSettingsRequest = true;
    return;
  }
  respondToSettingsRequest();
});

function respondToSettingsRequest() {
  pendingSettingsRequest = false;
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
    const canReceivePrivate =
      (currentAccess.reason === 'localhost' ||
        currentAccess.reason === 'approved') &&
      !layer.disabled;
    element.dataset.locatorEditorWithheld = canReceivePrivate
      ? 'false'
      : 'true';
    element.dataset.locatorUserExtensionOptions = JSON.stringify(
      canReceivePrivate ? layer : safeFrameProjection(layer)
    );
  });
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

mountSnapshotBridge(() => currentAccess);
