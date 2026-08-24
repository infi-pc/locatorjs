import { cleanup, render } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  storageGet: vi.fn(),
  storageSet: vi.fn(),
  storageRemove: vi.fn(),
  storageChangedAddListener: vi.fn(),
  tabsQuery: vi.fn(),
  tabsSendMessage: vi.fn(),
  tabsReload: vi.fn(),
}));

vi.mock('../../browser', () => ({
  default: {
    storage: {
      local: {
        get: mocks.storageGet,
        set: mocks.storageSet,
        remove: mocks.storageRemove,
      },
      onChanged: {
        addListener: mocks.storageChangedAddListener,
      },
    },
    tabs: {
      query: mocks.tabsQuery,
      sendMessage: mocks.tabsSendMessage,
      reload: mocks.tabsReload,
    },
  },
}));

import {
  SyncedStateProvider,
  useSyncedState,
  type Snapshot,
} from './syncedState';
import { __resetStorageContractForTesting } from '../../storageContract';

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
    __resetStorageContractForTesting();
    mocks.storageGet.mockResolvedValue({ userOptions: {} });
    mocks.storageSet.mockResolvedValue(undefined);
    mocks.storageRemove.mockResolvedValue(undefined);
    mocks.tabsQuery.mockResolvedValue([{ id: 42 }]);
    mocks.tabsSendMessage.mockResolvedValue({
      ok: true,
      protocolVersion: 2,
      snapshot,
    });
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
      projectPath: undefined,
      tmuxSession: 'work',
    });

    expect(mocks.tabsSendMessage).toHaveBeenCalledWith(
      42,
      {
        from: 'popup',
        subject: 'applySiteLocal',
        patch: { tmuxSession: 'work' },
        unset: ['projectPath'],
      },
      // The content script runs in every frame; only the top one is addressed.
      { frameId: 0 }
    );
  });

  test('strips undefined values before writing extension storage', async () => {
    await syncedState.setUserExtension({
      debugMode: true,
      projectPath: undefined,
    });

    expect(mocks.storageSet).toHaveBeenCalledWith({
      userOptions: { version: 2, options: { debugMode: true } },
    });
  });

  test('clears extension defaults without touching site-local state', async () => {
    const result = await syncedState.clearUserExtension();
    expect(result).toEqual({ ok: true });
    expect(mocks.storageSet).toHaveBeenCalledWith({
      userOptions: { version: 2, options: {} },
    });
    expect(syncedState.userExtension()).toEqual({});
  });

  test('sends the selected action to the active page for Try mode', async () => {
    mocks.tabsSendMessage.mockClear();
    mocks.tabsSendMessage.mockResolvedValue({ ok: true });
    await expect(syncedState.tryAction({ kind: 'copy-path' })).resolves.toEqual(
      {
        ok: true,
      }
    );
    expect(mocks.tabsSendMessage).toHaveBeenCalledWith(
      42,
      {
        from: 'popup',
        subject: 'tryAction',
        action: { kind: 'copy-path' },
      },
      { frameId: 0 }
    );
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
      trigger: { kind: 'modifier-click', modifiers: 'meta' },
      action: { kind: 'open-editor' },
    });
    expect(mocks.storageSet).toHaveBeenCalledWith({
      userOptions: {
        version: 2,
        options: expect.objectContaining({ bindings: expect.any(Array) }),
      },
      controls: 'meta',
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
