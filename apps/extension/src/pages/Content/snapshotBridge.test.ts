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
      '*'
    );
  });

  test('ignores messages not sent by the popup', () => {
    expect(listener({ from: 'page' }, {}, vi.fn())).toBe(false);
    expect(postMessage).not.toHaveBeenCalled();
  });
});
