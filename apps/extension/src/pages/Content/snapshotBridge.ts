import browser from '../../browser';

const REPLY_TIMEOUT_MS = 1000;

type PopupMessage =
  | { from: 'popup'; subject: 'requestSnapshot' }
  | {
      from: 'popup';
      subject: 'applySiteLocal';
      patch: Record<string, unknown>;
    };

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
          (payload) => {
            if (payload === null) {
              sendResponse({ ok: false, reason: 'no-runtime' });
            } else {
              sendResponse({ ok: true, snapshot: payload });
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
          },
          'LOCATOR_PAGE_SITE_LOCAL_WRITE_RESULT',
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

      return false;
    }
  );
}

function relayRequestToPage(
  request: Record<string, unknown>,
  responseType: string,
  done: (payload: unknown | null) => void
) {
  const requestId = generateRequestId();
  let settled = false;

  function handler(event: MessageEvent) {
    if (event.source !== window) return;
    const data = event.data;
    if (!data || typeof data !== 'object') return;
    if (data.type !== responseType) return;
    if (data.requestId !== requestId) return;

    settled = true;
    window.removeEventListener('message', handler);
    done(data.snapshot ?? data.result ?? null);
  }

  window.addEventListener('message', handler);
  window.postMessage({ ...request, requestId }, '*');

  setTimeout(() => {
    if (settled) return;
    settled = true;
    window.removeEventListener('message', handler);
    done(null);
  }, REPLY_TIMEOUT_MS);
}

function generateRequestId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
