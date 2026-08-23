import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  addListener: vi.fn(),
}));

vi.mock('../../browser', () => ({
  default: {
    runtime: {
      onMessage: {
        addListener: mocks.addListener,
      },
    },
  },
}));

import { mountSnapshotBridge } from './snapshotBridge';

type MessageListener = (
  message: unknown,
  sender: unknown,
  sendResponse: (response: unknown) => void
) => boolean;

describe('mountSnapshotBridge', () => {
  let listener: MessageListener;
  let postMessage: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    postMessage = vi
      .spyOn(window, 'postMessage')
      .mockImplementation(() => undefined);
    mountSnapshotBridge();
    listener = mocks.addListener.mock.calls[0][0] as MessageListener;
  });

  test('relays a requestId-matched snapshot reply', () => {
    const sendResponse = vi.fn();
    expect(
      listener({ from: 'popup', subject: 'requestSnapshot' }, {}, sendResponse)
    ).toBe(true);

    const request = postMessage.mock.calls[0][0] as Record<string, unknown>;
    window.dispatchEvent(
      new MessageEvent('message', {
        source: window,
        data: {
          type: 'LOCATOR_PAGE_SNAPSHOT_RESPONSE',
          requestId: request.requestId,
          snapshot: {
            effective: {
              bindings: [
                {
                  trigger: { kind: 'modifier-click', modifiers: 'alt' },
                  action: { kind: 'open-editor', targetId: 'vscode' },
                },
              ],
            },
            provenance: {},
            layers: {},
            allTargets: {},
          },
        },
      })
    );

    expect(sendResponse).toHaveBeenCalledWith({
      ok: true,
      snapshot: {
        effective: {
          bindings: [
            {
              trigger: { kind: 'modifier-click', modifiers: 'alt' },
              action: { kind: 'open-editor', targetId: 'vscode' },
            },
          ],
        },
        provenance: {},
        layers: {},
        allTargets: {},
      },
    });
  });

  test('returns no-runtime after the page reply timeout', () => {
    const sendResponse = vi.fn();
    listener({ from: 'popup', subject: 'requestSnapshot' }, {}, sendResponse);

    vi.advanceTimersByTime(1000);

    expect(sendResponse).toHaveBeenCalledWith({
      ok: false,
      reason: 'no-runtime',
    });
  });

  test('ignores a reply with a mismatched requestId', () => {
    const sendResponse = vi.fn();
    listener({ from: 'popup', subject: 'requestSnapshot' }, {}, sendResponse);

    window.dispatchEvent(
      new MessageEvent('message', {
        source: window,
        data: {
          type: 'LOCATOR_PAGE_SNAPSHOT_RESPONSE',
          requestId: 'someone-elses-request',
          snapshot: {},
        },
      })
    );

    expect(sendResponse).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(sendResponse).toHaveBeenCalledWith({
      ok: false,
      reason: 'no-runtime',
    });
  });

  test('defaults applySiteLocal unset to an empty array', () => {
    listener(
      {
        from: 'popup',
        subject: 'applySiteLocal',
        patch: { debugMode: true },
      },
      {},
      vi.fn()
    );

    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'LOCATOR_PAGE_SITE_LOCAL_WRITE',
        patch: { debugMode: true },
        unset: [],
      }),
      window.location.origin
    );
  });

  test('relays a selected action and returns its request-matched result', () => {
    const sendResponse = vi.fn();
    listener(
      {
        from: 'popup',
        subject: 'tryAction',
        action: { kind: 'copy-path' },
      },
      {},
      sendResponse
    );

    const request = postMessage.mock.calls[0][0] as Record<string, unknown>;
    expect(request).toEqual(
      expect.objectContaining({
        type: 'LOCATOR_PAGE_TRY_ACTION',
        action: { kind: 'copy-path' },
      })
    );
    window.dispatchEvent(
      new MessageEvent('message', {
        source: window,
        data: {
          type: 'LOCATOR_PAGE_TRY_ACTION_RESULT',
          requestId: request.requestId,
          result: { ok: true },
        },
      })
    );
    expect(sendResponse).toHaveBeenCalledWith({ ok: true });
  });

  test('relays site-local clear independently from patch writes', () => {
    listener({ from: 'popup', subject: 'clearSiteLocal' }, {}, vi.fn());
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'LOCATOR_PAGE_SITE_LOCAL_CLEAR' }),
      window.location.origin
    );
  });

  test('ignores messages not sent by the popup', () => {
    expect(listener({ from: 'page' }, {}, vi.fn())).toBe(false);
    expect(postMessage).not.toHaveBeenCalled();
  });
});

describe('mountSnapshotBridge payload validation', () => {
  let listener: MessageListener;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.spyOn(window, 'postMessage').mockImplementation(() => undefined);
    mountSnapshotBridge();
    listener = mocks.addListener.mock.calls[0][0] as MessageListener;
  });

  function replyTo(subject: string, payloadKey: string, payload: unknown) {
    const sendResponse = vi.fn();
    listener({ from: 'popup', subject }, {}, sendResponse);
    const request = (window.postMessage as unknown as ReturnType<typeof vi.fn>)
      .mock.calls[0][0] as Record<string, unknown>;
    window.dispatchEvent(
      new MessageEvent('message', {
        source: window,
        data: {
          type:
            subject === 'requestSnapshot'
              ? 'LOCATOR_PAGE_SNAPSHOT_RESPONSE'
              : 'LOCATOR_PAGE_SITE_LOCAL_WRITE_RESULT',
          requestId: request.requestId,
          [payloadKey]: payload,
        },
      })
    );
    return sendResponse;
  }

  test('a forged write result that is not a WriteResult is ignored', () => {
    // The page can see the requestId -- it is posted on window -- so it can
    // answer first. It cannot be authenticated, but it can be held to a shape.
    const sendResponse = replyTo('applySiteLocal', 'result', {
      totally: 'made up',
    });

    expect(sendResponse).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(sendResponse).toHaveBeenCalledWith({
      ok: false,
      reason: 'no-runtime',
    });
  });

  test('a forged snapshot missing its fields is ignored', () => {
    const sendResponse = replyTo('requestSnapshot', 'snapshot', {
      effective: { projectPath: '/evil' },
    });

    expect(sendResponse).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(sendResponse).toHaveBeenCalledWith({
      ok: false,
      reason: 'no-runtime',
    });
  });

  test('a malformed reply does not lock out the real one', () => {
    // Settling on the first matching message let a page win the race and
    // suppress the runtime's answer entirely.
    const sendResponse = vi.fn();
    listener({ from: 'popup', subject: 'applySiteLocal' }, {}, sendResponse);
    const request = (window.postMessage as unknown as ReturnType<typeof vi.fn>)
      .mock.calls[0][0] as Record<string, unknown>;

    const reply = (result: unknown) =>
      window.dispatchEvent(
        new MessageEvent('message', {
          source: window,
          data: {
            type: 'LOCATOR_PAGE_SITE_LOCAL_WRITE_RESULT',
            requestId: request.requestId,
            result,
          },
        })
      );

    reply({ nonsense: true });
    reply({ ok: false, reason: 'quota' });

    expect(sendResponse).toHaveBeenCalledWith({ ok: false, reason: 'quota' });
  });

  test('normalises a WriteResult rather than passing it through', () => {
    const sendResponse = replyTo('applySiteLocal', 'result', {
      ok: false,
      reason: 'quota',
      extra: 'ignored',
    });

    expect(sendResponse).toHaveBeenCalledWith({ ok: false, reason: 'quota' });
  });
});
