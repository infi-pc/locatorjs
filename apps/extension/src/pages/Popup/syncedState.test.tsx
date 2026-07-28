import { cleanup, render } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  storageGet: vi.fn(),
  storageSet: vi.fn(),
  storageChangedAddListener: vi.fn(),
  tabsQuery: vi.fn(),
  tabsSendMessage: vi.fn(),
}));

vi.mock('../../browser', () => ({
  default: {
    storage: {
      local: {
        get: mocks.storageGet,
        set: mocks.storageSet,
      },
      onChanged: {
        addListener: mocks.storageChangedAddListener,
      },
    },
    tabs: {
      query: mocks.tabsQuery,
      sendMessage: mocks.tabsSendMessage,
    },
  },
}));

import {
  SyncedStateProvider,
  useSyncedState,
  type Snapshot,
} from './syncedState';

let syncedState: ReturnType<typeof useSyncedState>;

function Harness() {
  syncedState = useSyncedState();
  return <div />;
}

const snapshot: Snapshot = {
  effective: {},
  provenance: {},
  layers: {},
  allTargets: {},
};

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}

describe('SyncedStateProvider', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mocks.storageGet.mockResolvedValue({ userOptions: {} });
    mocks.storageSet.mockResolvedValue(undefined);
    mocks.tabsQuery.mockResolvedValue([{ id: 42 }]);
    mocks.tabsSendMessage.mockResolvedValue({ ok: true, snapshot });
    render(() => (
      <SyncedStateProvider>
        <Harness />
      </SyncedStateProvider>
    ));
    await flushPromises();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  test('serializes undefined keys when writing site-local options', async () => {
    mocks.tabsSendMessage.mockClear();
    mocks.tabsSendMessage.mockResolvedValue({ ok: true });

    await syncedState.setSiteLocal({
      targetId: undefined,
      targetTemplate: 'zed://file/${filePath}',
    });

    expect(mocks.tabsSendMessage).toHaveBeenCalledWith(42, {
      from: 'popup',
      subject: 'applySiteLocal',
      patch: { targetTemplate: 'zed://file/${filePath}' },
      unset: ['targetId'],
    });
  });

  test('strips undefined values before writing extension storage', async () => {
    await syncedState.setUserExtension({
      debugMode: true,
      targetId: undefined,
    });

    expect(mocks.storageSet).toHaveBeenCalledWith({
      userOptions: { debugMode: true },
    });
  });

  test('migrates legacy extension modifiers in storage changes', async () => {
    const listener = mocks.storageChangedAddListener.mock.calls[0][0];
    listener(
      {
        userOptions: {
          newValue: { mouseModifiers: 'meta' },
        },
      },
      'local'
    );
    await flushPromises();

    expect(syncedState.userExtension().mouseModifiers).toBeUndefined();
    expect(syncedState.userExtension().bindings?.[0]).toEqual({
      modifiers: 'meta',
      action: { kind: 'open-editor' },
    });
    expect(mocks.storageSet).toHaveBeenCalledWith({
      userOptions: expect.objectContaining({
        bindings: expect.any(Array),
      }),
    });
  });

  test('polling marks the popup disconnected when sendMessage rejects', async () => {
    expect(syncedState.status()).toBe('connected');
    mocks.tabsSendMessage.mockRejectedValue(new Error('no content script'));

    vi.advanceTimersByTime(1500);
    await flushPromises();

    expect(syncedState.status()).toBe('no-runtime');
    expect(syncedState.snapshot()).toBeNull();
  });
});
