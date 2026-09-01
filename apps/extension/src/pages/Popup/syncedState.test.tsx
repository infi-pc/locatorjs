import { strictConfig } from '@locator/shared';
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
    runtime: {
      getManifest: () => ({ version: '2.0.0' }),
    },
  },
}));

import {
  SyncedStateProvider,
  useSyncedState,
  type Snapshot,
} from './syncedState';
import {
  __resetStorageContractForTesting,
  USER_CONFIG_KEY,
} from '../../storageContract';

let syncedState: ReturnType<typeof useSyncedState>;
let stored: Record<string, unknown>;

function Harness() {
  syncedState = useSyncedState();
  return <div />;
}

function validSnapshot(): Snapshot {
  const layers = {
    default: strictConfig.encodeLayer(strictConfig.DEFAULT_LAYER),
  };
  const resolved = strictConfig.resolveConfig(
    { default: strictConfig.DEFAULT_LAYER },
    strictConfig.BUILT_IN_TARGETS
  );
  return {
    effective: strictConfig.effectiveOptionsView(
      strictConfig.effectiveOptions(resolved)
    ),
    provenance: strictConfig.configProvenance(resolved),
    layers,
    allTargets: strictConfig.targetRegistryView(strictConfig.BUILT_IN_TARGETS),
  };
}

const snapshot = validSnapshot();

async function flushPromises() {
  for (let index = 0; index < 8; index += 1) await Promise.resolve();
}

describe('SyncedStateProvider', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    __resetStorageContractForTesting();
    stored = {};
    mocks.storageGet.mockImplementation(async (keys: string[]) => {
      const result: Record<string, unknown> = {};
      for (const key of keys) if (key in stored) result[key] = stored[key];
      return result;
    });
    mocks.storageSet.mockImplementation(
      async (patch: Record<string, unknown>) => {
        Object.assign(stored, patch);
      }
    );
    mocks.storageRemove.mockImplementation(async (keys: string[]) => {
      for (const key of keys) delete stored[key];
    });
    mocks.tabsQuery.mockResolvedValue([{ id: 42 }]);
    mocks.tabsSendMessage.mockResolvedValue({
      ok: true,
      protocolVersion: 3,
      extensionVersion: '2.0.0',
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

  test('sends explicit site-local sets and unsets', async () => {
    mocks.tabsSendMessage.mockClear();
    mocks.tabsSendMessage.mockResolvedValue({ ok: true });

    await syncedState.setSiteLocal({
      set: { tmuxSession: 'work' },
      unset: ['projectPath'],
    });

    expect(mocks.tabsSendMessage).toHaveBeenCalledWith(
      42,
      {
        from: 'popup',
        subject: 'applySiteLocal',
        set: { tmuxSession: 'work' },
        unset: ['projectPath'],
      },
      { frameId: 0 }
    );
  });

  test('does not admit an arbitrary write reason from the active page', async () => {
    mocks.tabsSendMessage.mockClear();
    mocks.tabsSendMessage.mockResolvedValue({ ok: false, reason: 'hunter2' });

    await expect(
      syncedState.setSiteLocal({ set: { projectPath: '/repo' } })
    ).resolves.toEqual({ ok: false, reason: 'unknown' });
  });

  test('writes one versioned extension envelope', async () => {
    await expect(
      syncedState.setUserExtension({ set: { debugMode: true } })
    ).resolves.toEqual({ ok: true });

    expect(stored[USER_CONFIG_KEY]).toEqual({
      version: 3,
      revision: 1,
      layer: { debugMode: true },
    });
    expect(syncedState.userExtension()).toEqual({ debugMode: true });
  });

  test('clears extension defaults independently from site-local state', async () => {
    await syncedState.setUserExtension({ set: { projectPath: '/repo' } });
    const result = await syncedState.clearUserExtension();

    expect(result).toEqual({ ok: true });
    expect(stored).not.toHaveProperty(USER_CONFIG_KEY);
    expect(syncedState.userExtension()).toEqual({});
  });

  test('reacts only to the v3 storage key', async () => {
    const listener = mocks.storageChangedAddListener.mock.calls[0][0];
    listener(
      {
        [USER_CONFIG_KEY]: {
          newValue: {
            version: 3,
            revision: 7,
            layer: { projectPath: '/changed' },
          },
        },
      },
      'local'
    );
    await flushPromises();

    expect(syncedState.userExtension()).toEqual({ projectPath: '/changed' });
  });

  test('sends the selected action to the active page for Try mode', async () => {
    mocks.tabsSendMessage.mockClear();
    mocks.tabsSendMessage.mockResolvedValue({ ok: true });
    await expect(syncedState.tryAction({ kind: 'copy-path' })).resolves.toEqual(
      { ok: true }
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

  test('polling marks the popup disconnected when sendMessage rejects', async () => {
    expect(syncedState.status()).toBe('connected');
    mocks.tabsSendMessage.mockRejectedValue(new Error('no content script'));

    vi.advanceTimersByTime(1500);
    await flushPromises();

    expect(syncedState.status()).toBe('no-runtime');
    expect(syncedState.snapshot()).toBeNull();
  });

  test('requires a reload when a failed tab predates the extension update', async () => {
    stored = {
      locatorExtensionUpdateVersion: '2.0.0',
      'locatorExtensionStaleTab:42': '2.0.0',
    };
    mocks.tabsSendMessage.mockRejectedValue(
      new Error('orphaned content script')
    );

    vi.advanceTimersByTime(1500);
    await flushPromises();

    expect(syncedState.status()).toBe('reload-required');
  });

  test('requires a reload for another bridge protocol or extension version', async () => {
    mocks.tabsSendMessage.mockResolvedValue({
      ok: true,
      protocolVersion: 2,
      extensionVersion: '1.9.0',
      snapshot,
    });

    vi.advanceTimersByTime(1500);
    await flushPromises();

    expect(syncedState.status()).toBe('reload-required');
  });

  test('keeps site reset recoverable when its snapshot is rejected', async () => {
    mocks.tabsSendMessage.mockResolvedValue({
      ok: false,
      protocolVersion: 3,
      extensionVersion: '2.0.0',
      reason: 'snapshot-rejected',
      siteLocalPresent: true,
    });

    vi.advanceTimersByTime(1500);
    await flushPromises();

    expect(syncedState.status()).toBe('no-runtime');
    expect(syncedState.siteLocalPresent()).toBe(true);
  });
});
