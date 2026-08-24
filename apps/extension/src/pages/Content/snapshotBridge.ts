import {
  decodeLocatorLayers,
  decodeLocatorOptions,
  decodeProvenance,
  decodeTargets,
  decodeTryActionResult,
  decodeWriteResult,
  postMessageOrigin,
  type BindingAction,
} from '@locator/shared';
import browser from '../../browser';

const REPLY_TIMEOUT_MS = 1000;
export const EXTENSION_PROTOCOL_VERSION = 2 as const;

type PopupMessage =
  | { from: 'popup'; subject: 'requestSnapshot' }
  | {
      from: 'popup';
      subject: 'applySiteLocal';
      patch: Record<string, unknown>;
      unset?: string[];
    }
  | { from: 'popup'; subject: 'clearSiteLocal' }
  | { from: 'popup'; subject: 'tryAction'; action: BindingAction };

export function mountSnapshotBridge() {
  browser.runtime.onMessage.addListener(
    (msg: PopupMessage, _sender, sendResponse) => {
      if (!msg || msg.from !== 'popup') {
        return false;
      }

      if (msg.subject === 'requestSnapshot') {
        relayRequestToPage(
          {
            type: 'LOCATOR_PAGE_SNAPSHOT_REQUEST',
          },
          'LOCATOR_PAGE_SNAPSHOT_RESPONSE',
          validateSnapshot,
          (payload, rejectedValue) => {
            if (payload === null) {
              sendResponse({
                ok: false,
                protocolVersion: EXTENSION_PROTOCOL_VERSION,
                extensionVersion: browser.runtime.getManifest().version,
                reason: rejectedValue ? 'snapshot-rejected' : 'no-runtime',
                siteLocalPresent: snapshotHasSiteLocal(rejectedValue),
                diagnostic: hookDiagnostic(),
              });
            } else {
              sendResponse({
                ok: true,
                protocolVersion: EXTENSION_PROTOCOL_VERSION,
                extensionVersion: browser.runtime.getManifest().version,
                snapshot: payload,
              });
            }
          }
        );
        return true;
      }

      if (msg.subject === 'applySiteLocal') {
        relayRequestToPage(
          {
            type: 'LOCATOR_PAGE_SITE_LOCAL_WRITE',
            patch: msg.patch,
            unset: msg.unset ?? [],
          },
          'LOCATOR_PAGE_SITE_LOCAL_WRITE_RESULT',
          decodeWriteResult,
          (payload) => {
            if (payload === null) {
              sendResponse({ ok: false, reason: 'no-runtime' });
            } else {
              sendResponse(payload);
            }
          }
        );
        return true;
      }

      if (msg.subject === 'clearSiteLocal') {
        relayRequestToPage(
          { type: 'LOCATOR_PAGE_SITE_LOCAL_CLEAR' },
          'LOCATOR_PAGE_SITE_LOCAL_CLEAR_RESULT',
          decodeWriteResult,
          (payload) =>
            sendResponse(payload ?? { ok: false, reason: 'no-runtime' })
        );
        return true;
      }

      if (msg.subject === 'tryAction') {
        relayRequestToPage(
          { type: 'LOCATOR_PAGE_TRY_ACTION', action: msg.action },
          'LOCATOR_PAGE_TRY_ACTION_RESULT',
          decodeTryActionResult,
          (payload) =>
            sendResponse(payload ?? { ok: false, reason: 'no-runtime' })
        );
        return true;
      }

      return false;
    }
  );
}

function hookDiagnostic() {
  return (
    document.head?.dataset.locatorDisabled ||
    document.head?.dataset.locatorHookStatusMessage
  );
}

/**
 * Trust boundary.
 *
 * The runtime lives in the page's own JavaScript world, so anything in that
 * page can see a request posted on `window` and answer it first. There is no
 * way to authenticate the responder from here -- the page owns that world.
 * What we can do is refuse to pass anything through that is not shaped like a
 * real reply, so a hostile page can at worst lie about its *own* settings
 * rather than inject arbitrary structures into the popup.
 *
 * The popup must therefore treat everything relayed here as untrusted display
 * data, and never persist it to `browser.storage` unvalidated.
 */
type ValidatedPayload = Record<string, unknown>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A `Snapshot`: four plain-object fields, rebuilt rather than passed through. */
function validateSnapshot(value: unknown): ValidatedPayload | null {
  if (!isPlainObject(value)) return null;
  const { effective, provenance, layers, allTargets } = value;
  const safeEffective = decodeLocatorOptions(effective);
  const safeProvenance = decodeProvenance(provenance);
  const safeLayers = decodeLocatorLayers(layers);
  const safeTargets = decodeTargets(allTargets);
  return safeEffective && safeProvenance && safeLayers && safeTargets
    ? {
        effective: safeEffective,
        provenance: safeProvenance,
        layers: safeLayers,
        allTargets: safeTargets,
      }
    : null;
}

function snapshotHasSiteLocal(value: unknown): boolean {
  if (!isPlainObject(value) || !isPlainObject(value.layers)) return false;
  const siteLocal = value.layers['user-origin'];
  return isPlainObject(siteLocal) && Object.keys(siteLocal).length > 0;
}

function relayRequestToPage<T extends object>(
  request: Record<string, unknown>,
  responseType: string,
  validate: (value: unknown) => T | null,
  done: (payload: T | null, rejectedValue?: unknown) => void
) {
  const requestId = generateRequestId();
  let settled = false;
  let rejectedValue: unknown;

  function finish(payload: T | null) {
    if (settled) return;
    settled = true;
    window.removeEventListener('message', handler);
    done(payload, rejectedValue);
  }

  function handler(event: MessageEvent) {
    if (event.source !== window) return;
    const data = event.data;
    if (!isPlainObject(data)) return;
    if (data.type !== responseType) return;
    if (data.requestId !== requestId) return;

    // A malformed reply is treated as no reply, so a page cannot settle the
    // request early with junk and lock out the runtime's real answer.
    const payload = validate(data.snapshot ?? data.result);
    if (payload === null) {
      rejectedValue = data.snapshot ?? data.result;
      return;
    }

    finish(payload);
  }

  window.addEventListener('message', handler);
  window.postMessage(
    { ...request, requestId },
    postMessageOrigin(window.location)
  );

  setTimeout(() => finish(null), REPLY_TIMEOUT_MS);
}

function generateRequestId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
