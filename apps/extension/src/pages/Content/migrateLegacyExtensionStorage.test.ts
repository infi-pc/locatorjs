import { strictConfig } from '@locator/shared';
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
  migrateLegacyExtensionStorage,
  USER_CONFIG_KEY,
} from './migrateLegacyExtensionStorage';
import {
  __resetStorageContractForTesting,
  ensureExtensionStorageReady,
  migrateLegacyExtensionFields,
  patchExtensionConfig,
  PREVIEW_V2_USER_OPTIONS_KEY,
} from '../../storageContract';

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

function layerView(legacy: Record<string, unknown>) {
  return strictConfig.encodeLayer(migrateLegacyExtensionFields(legacy));
}

describe('migrateLegacyExtensionFields', () => {
  test('parses a released editor id and modifier chord', () => {
    expect(layerView({ target: 'webstorm', controls: 'ctrl+shift' })).toEqual({
      editor: { kind: 'target', id: 'webstorm' },
      bindings: [
        {
          trigger: {
            kind: 'modifier-click',
            modifiers: ['ctrl', 'shift'],
          },
          action: { kind: 'open-editor' },
        },
        { trigger: { kind: 'hover-toolbar' }, action: { kind: 'show-tree' } },
        {
          trigger: { kind: 'hover-toolbar' },
          action: { kind: 'show-parents' },
        },
        { trigger: { kind: 'hover-toolbar' }, action: { kind: 'copy-path' } },
      ],
    });
  });

  test('keeps a valid custom URL as a template', () => {
    expect(layerView({ target: 'myeditor://file/${filePath}' })).toEqual({
      editor: {
        kind: 'template',
        template: 'myeditor://file/${filePath}',
      },
    });
  });

  test('an empty legacy chord leaves only toolbar actions', () => {
    expect(layerView({ controls: '' }).bindings).toEqual([
      { trigger: { kind: 'hover-toolbar' }, action: { kind: 'show-tree' } },
      {
        trigger: { kind: 'hover-toolbar' },
        action: { kind: 'show-parents' },
      },
      { trigger: { kind: 'hover-toolbar' }, action: { kind: 'copy-path' } },
    ]);
  });

  test('invalid legacy fields are discarded independently', () => {
    expect(layerView({ target: 42, controls: 'ctrl+unknown' })).toEqual({});
    expect(layerView({ target: 42, controls: 'alt' })).toMatchObject({
      bindings: expect.any(Array),
    });
  });
});

describe('migrateLegacyExtensionStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetStorageContractForTesting();
  });

  test('writes one v3 envelope before removing released legacy keys', async () => {
    const stored = withStorage({
      target: 'webstorm',
      controls: 'ctrl+shift',
      clickCount: 12,
    });

    await migrateLegacyExtensionStorage();

    expect(stored[USER_CONFIG_KEY]).toMatchObject({
      version: 3,
      revision: 0,
      layer: {
        editor: { kind: 'target', id: 'webstorm' },
        bindings: expect.any(Array),
      },
    });
    expect(stored).not.toHaveProperty('target');
    expect(stored).not.toHaveProperty('controls');
    expect(stored).not.toHaveProperty('clickCount');
    expect(mocks.set.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.remove.mock.invocationCallOrder[0]
    );
  });

  test('keeps an existing v3 envelope as the sole source of truth', async () => {
    const envelope = {
      version: 3,
      revision: 4,
      layer: { editor: { kind: 'target', id: 'zed' } },
    };
    const stored = withStorage({
      [USER_CONFIG_KEY]: envelope,
      target: 'webstorm',
      controls: 'ctrl',
    });

    await migrateLegacyExtensionStorage();

    expect(stored[USER_CONFIG_KEY]).toBe(envelope);
    expect(stored).not.toHaveProperty('target');
    expect(stored).not.toHaveProperty('controls');
    expect(mocks.set).not.toHaveBeenCalled();
  });

  test('does not reinterpret the unreleased preview format', async () => {
    const preview = { version: 2, options: { projectPath: '/repo' } };
    const stored = withStorage({
      [PREVIEW_V2_USER_OPTIONS_KEY]: preview,
      target: 'webstorm',
    });

    await migrateLegacyExtensionStorage();

    expect(stored[PREVIEW_V2_USER_OPTIONS_KEY]).toBe(preview);
    expect(stored).not.toHaveProperty(USER_CONFIG_KEY);
    await expect(ensureExtensionStorageReady()).resolves.toEqual({
      kind: 'reset-required',
    });
  });

  test('removes obsolete telemetry without manufacturing config', async () => {
    const stored = withStorage({ clickCount: 3, allowTracking: true });

    await migrateLegacyExtensionStorage();

    expect(stored).toEqual({});
    expect(mocks.set).not.toHaveBeenCalled();
  });

  test('is idempotent across fresh module readiness cycles', async () => {
    const stored = withStorage({ target: 'webstorm' });
    await migrateLegacyExtensionStorage();
    const firstEnvelope = stored[USER_CONFIG_KEY];

    __resetStorageContractForTesting();
    await migrateLegacyExtensionStorage();

    expect(stored[USER_CONFIG_KEY]).toBe(firstEnvelope);
    expect(mocks.set).toHaveBeenCalledTimes(1);
  });

  test('a future envelope is reported without being overwritten', async () => {
    const future = { version: 99, revision: 0, layer: {} };
    const stored = withStorage({ [USER_CONFIG_KEY]: future });

    await expect(ensureExtensionStorageReady()).resolves.toEqual({
      kind: 'future-version',
      version: 99,
    });
    expect(stored[USER_CONFIG_KEY]).toBe(future);
    expect(mocks.set).not.toHaveBeenCalled();
  });

  test('keeps recoverable legacy fields when the current envelope is corrupt', async () => {
    const corrupt = { version: 3, revision: 0, layer: { disabled: 'yes' } };
    const stored = withStorage({
      [USER_CONFIG_KEY]: corrupt,
      target: 'webstorm',
      controls: 'ctrl',
      clickCount: 12,
    });

    await expect(ensureExtensionStorageReady()).resolves.toMatchObject({
      kind: 'corrupt',
    });
    expect(stored[USER_CONFIG_KEY]).toBe(corrupt);
    expect(stored.target).toBe('webstorm');
    expect(stored.controls).toBe('ctrl');
    expect(stored).not.toHaveProperty('clickCount');
    expect(mocks.set).not.toHaveBeenCalled();
  });

  test('does not write or advance a revision for a no-op patch', async () => {
    const envelope = {
      version: 3,
      revision: 4,
      layer: { editor: { kind: 'target', id: 'zed' } },
    };
    const stored = withStorage({ [USER_CONFIG_KEY]: envelope });

    await expect(
      patchExtensionConfig({ unset: ['projectPath'] })
    ).resolves.toEqual({ ok: true });

    expect(stored[USER_CONFIG_KEY]).toBe(envelope);
    expect(mocks.set).not.toHaveBeenCalled();
  });

  test('the content bootstrap stays inert when storage is unavailable', async () => {
    mocks.get.mockRejectedValue(new Error('no storage'));
    await expect(migrateLegacyExtensionStorage()).resolves.toBeUndefined();
  });
});
