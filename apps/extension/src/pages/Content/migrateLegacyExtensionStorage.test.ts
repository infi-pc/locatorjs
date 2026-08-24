import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('../../browser', () => ({
  default: { storage: { local: mocks } },
}));

import {
  migrateLegacyExtensionOptions,
  migrateLegacyExtensionStorage,
  USER_OPTIONS_KEY,
} from './migrateLegacyExtensionStorage';
import {
  __resetStorageContractForTesting,
  USER_OPTIONS_SCHEMA_VERSION,
} from '../../storageContract';

/** Stands in for `storage.local` holding exactly `stored`. */
function withStorage(stored: Record<string, unknown>) {
  mocks.get.mockImplementation(async (keys: string[]) => {
    const result: Record<string, unknown> = {};
    for (const key of keys) {
      if (key in stored) result[key] = stored[key];
    }
    return result;
  });
  mocks.set.mockImplementation(async (patch: Record<string, unknown>) => {
    Object.assign(stored, patch);
  });
  mocks.remove.mockImplementation(async (keys: string[]) => {
    for (const key of keys) delete stored[key];
  });
  return stored;
}

describe('migrateLegacyExtensionOptions', () => {
  test('maps a known editor id and the modifier string', () => {
    expect(
      migrateLegacyExtensionOptions({
        target: 'webstorm',
        controls: 'ctrl+shift',
      })
    ).toEqual({
      editor: { targetId: 'webstorm' },
      mouseModifiers: 'ctrl+shift',
    });
  });

  test('keeps a custom URL as a template', () => {
    expect(
      migrateLegacyExtensionOptions({ target: 'myeditor://file/${filePath}' })
    ).toEqual({ editor: { targetTemplate: 'myeditor://file/${filePath}' } });
  });

  test('keeps an empty modifier string, which means "no modifier"', () => {
    expect(migrateLegacyExtensionOptions({ controls: '' })).toEqual({
      mouseModifiers: '',
    });
  });

  test('reports nothing worth keeping as null', () => {
    expect(migrateLegacyExtensionOptions({})).toBeNull();
    expect(migrateLegacyExtensionOptions({ target: 42 })).toBeNull();
  });
});

describe('migrateLegacyExtensionStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetStorageContractForTesting();
  });

  test('carries a 1.3.x user across and retains mirrored v1 keys', async () => {
    const stored = withStorage({
      target: 'webstorm',
      controls: 'ctrl+shift',
      clickCount: 12,
    });

    await migrateLegacyExtensionStorage();

    expect(stored[USER_OPTIONS_KEY]).toEqual({
      version: USER_OPTIONS_SCHEMA_VERSION,
      options: {
        editor: { targetId: 'webstorm' },
        bindings: expect.any(Array),
      },
    });
    expect(stored.target).toBe('webstorm');
    expect(stored.controls).toBe('ctrl+shift');
    expect(stored).not.toHaveProperty('clickCount');
  });

  test('never clobbers settings made since the upgrade', async () => {
    const stored = withStorage({
      target: 'webstorm',
      [USER_OPTIONS_KEY]: { editor: { targetId: 'zed' } },
    });

    await migrateLegacyExtensionStorage();

    expect(stored[USER_OPTIONS_KEY]).toEqual({
      version: USER_OPTIONS_SCHEMA_VERSION,
      options: { editor: { targetId: 'zed' } },
    });
    expect(stored.target).toBe('zed');
  });

  test('removes obsolete telemetry keys without writing anything', async () => {
    const stored = withStorage({ clickCount: 3, allowTracking: true });

    await migrateLegacyExtensionStorage();

    expect(stored[USER_OPTIONS_KEY]).toEqual({
      version: USER_OPTIONS_SCHEMA_VERSION,
      options: {},
    });
    expect(stored).not.toHaveProperty('clickCount');
  });

  test('is idempotent', async () => {
    const stored = withStorage({ target: 'webstorm' });

    await migrateLegacyExtensionStorage();
    __resetStorageContractForTesting();
    await migrateLegacyExtensionStorage();

    expect(stored[USER_OPTIONS_KEY]).toEqual({
      version: USER_OPTIONS_SCHEMA_VERSION,
      options: { editor: { targetId: 'webstorm' } },
    });
  });

  test('no-op when there is nothing legacy to migrate', async () => {
    withStorage({
      [USER_OPTIONS_KEY]: {
        version: USER_OPTIONS_SCHEMA_VERSION,
        options: { disabled: true },
      },
    });

    await migrateLegacyExtensionStorage();

    expect(mocks.set).not.toHaveBeenCalled();
  });

  test('does not re-import compatibility mirrors in a fresh realm', async () => {
    const stored = withStorage({});

    await migrateLegacyExtensionStorage();
    __resetStorageContractForTesting();
    await migrateLegacyExtensionStorage();

    expect(stored[USER_OPTIONS_KEY]).toEqual({
      version: USER_OPTIONS_SCHEMA_VERSION,
      options: {},
    });
    expect(stored).not.toHaveProperty('target');
    expect(stored).not.toHaveProperty('controls');
  });

  test('reads a future envelope without overwriting it', async () => {
    const future = {
      version: USER_OPTIONS_SCHEMA_VERSION + 1,
      options: { projectPath: '/repo', futureOption: true },
    };
    const stored = withStorage({ [USER_OPTIONS_KEY]: future });

    await migrateLegacyExtensionStorage();

    expect(stored[USER_OPTIONS_KEY]).toBe(future);
    expect(mocks.set).not.toHaveBeenCalled();
  });

  test('keeps valid settings when one stored field is unreadable', async () => {
    const stored = withStorage({
      [USER_OPTIONS_KEY]: {
        version: USER_OPTIONS_SCHEMA_VERSION,
        options: { projectPath: '/repo', disabled: 'broken' },
      },
    });

    await migrateLegacyExtensionStorage();

    expect(stored[USER_OPTIONS_KEY]).toEqual({
      version: USER_OPTIONS_SCHEMA_VERSION,
      options: { projectPath: '/repo' },
    });
  });

  test('resolves rather than throwing when storage is unavailable', async () => {
    mocks.get.mockRejectedValue(new Error('no storage'));

    await expect(migrateLegacyExtensionStorage()).resolves.toBeUndefined();
  });
});
