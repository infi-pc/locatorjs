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

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') return;
  if (USER_CONFIG_KEY in changes) {
    const read = decodeStoredExtensionConfig(changes[USER_CONFIG_KEY].newValue);
    publishUserExtensionLayer(layerFromRead(read));
  }
  if (
    currentAccess.origin &&
    `trustedOrigin:${currentAccess.origin}` in changes
  ) {
    void refreshOriginAccess();
  }
});

function refreshOriginAccess() {
  return browser.runtime
    .sendMessage({ from: 'content', subject: 'documentOrigin' })
    .then(
      (response: { origin?: unknown; access?: OriginAccess } | undefined) => {
        return (
          response?.access ?? { origin: null, reason: 'unavailable' as const }
        );
      }
    )
    .then((access) => {
      currentAccess = access;
      injectUserExtensionGlobal(latestLayer);
      if (
        documentOriginReady &&
        initialOptionsReady &&
        pendingSettingsRequest
      ) {
        respondToSettingsRequest();
      }
    });
}

void refreshOriginAccess()
  .then(() => {
    documentOriginReady = true;
  })
  .catch(() => {
    documentOriginReady = true;
    currentAccess = { origin: null, reason: 'unavailable' };
    injectUserExtensionGlobal(latestLayer);
  })
  .finally(() => {
    if (initialOptionsReady && pendingSettingsRequest)
      respondToSettingsRequest();
  });

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
