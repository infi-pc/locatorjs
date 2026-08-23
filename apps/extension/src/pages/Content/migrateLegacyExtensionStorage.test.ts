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

/** Stands in for `storage.local` holding exactly `stored`. */
function withStorage(stored: Record<string, unknown>) {
  mocks.get.mockImplementation(
    (keys: string[], done: (result: Record<string, unknown>) => void) => {
      const result: Record<string, unknown> = {};
      for (const key of keys) {
        if (key in stored) result[key] = stored[key];
      }
      done(result);
    }
  );
  mocks.set.mockImplementation(
    (patch: Record<string, unknown>, done?: () => void) => {
      Object.assign(stored, patch);
      done?.();
    }
  );
  mocks.remove.mockImplementation((keys: string[], done?: () => void) => {
    for (const key of keys) delete stored[key];
    done?.();
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
  });

  test('carries a 1.3.x user across and drops the v1 keys', async () => {
    const stored = withStorage({
      target: 'webstorm',
      controls: 'ctrl+shift',
      clickCount: 12,
    });

    await migrateLegacyExtensionStorage();

    expect(stored[USER_OPTIONS_KEY]).toEqual({
      editor: { targetId: 'webstorm' },
      mouseModifiers: 'ctrl+shift',
    });
    expect(stored).not.toHaveProperty('target');
    expect(stored).not.toHaveProperty('controls');
    expect(stored).not.toHaveProperty('clickCount');
  });

  test('never clobbers settings made since the upgrade', async () => {
    const stored = withStorage({
      target: 'webstorm',
      [USER_OPTIONS_KEY]: { editor: { targetId: 'zed' } },
    });

    await migrateLegacyExtensionStorage();

    expect(stored[USER_OPTIONS_KEY]).toEqual({ editor: { targetId: 'zed' } });
    expect(stored).not.toHaveProperty('target');
  });

  test('removes obsolete telemetry keys without writing anything', async () => {
    const stored = withStorage({ clickCount: 3, allowTracking: true });

    await migrateLegacyExtensionStorage();

    expect(mocks.set).not.toHaveBeenCalled();
    expect(stored).toEqual({});
  });

  test('is idempotent', async () => {
    const stored = withStorage({ target: 'webstorm' });

    await migrateLegacyExtensionStorage();
    await migrateLegacyExtensionStorage();

    expect(stored[USER_OPTIONS_KEY]).toEqual({
      editor: { targetId: 'webstorm' },
    });
  });

  test('no-op when there is nothing legacy to migrate', async () => {
    withStorage({ [USER_OPTIONS_KEY]: { disabled: true } });

    await migrateLegacyExtensionStorage();

    expect(mocks.set).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  test('resolves rather than throwing when storage is unavailable', async () => {
    mocks.get.mockImplementation(() => {
      throw new Error('no storage');
    });

    await expect(migrateLegacyExtensionStorage()).resolves.toBeUndefined();
  });
});
