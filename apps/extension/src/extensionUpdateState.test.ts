import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  values: {} as Record<string, unknown>,
  tabsQuery: vi.fn(),
}));

vi.mock('./browser', () => ({
  default: {
    runtime: { getManifest: () => ({ version: '2.0.0' }) },
    tabs: { query: mocks.tabsQuery },
    storage: {
      local: {
        get: vi.fn(async (keys: null | string | string[]) => {
          if (keys === null) return { ...mocks.values };
          const requested = Array.isArray(keys) ? keys : [keys];
          return Object.fromEntries(
            requested.flatMap((key) =>
              key in mocks.values ? [[key, mocks.values[key]]] : []
            )
          );
        }),
        set: vi.fn(async (values: Record<string, unknown>) => {
          Object.assign(mocks.values, values);
        }),
        remove: vi.fn(async (keys: string | string[]) => {
          for (const key of Array.isArray(keys) ? keys : [keys]) {
            delete mocks.values[key];
          }
        }),
      },
    },
  },
}));

import {
  clearTabReloadRequirement,
  recordExtensionUpdate,
  tabRequiresReload,
} from './extensionUpdateState';

describe('extension update state', () => {
  beforeEach(() => {
    mocks.values = {};
    mocks.tabsQuery.mockReset();
  });

  test('marks only tabs that were open during an update', async () => {
    mocks.tabsQuery.mockResolvedValue([{ id: 12 }, { id: 34 }, {}]);

    await recordExtensionUpdate('update');

    await expect(tabRequiresReload(12)).resolves.toBe(true);
    await expect(tabRequiresReload(34)).resolves.toBe(true);
    await expect(tabRequiresReload(56)).resolves.toBe(false);
  });

  test('clears one refreshed tab without losing another marker', async () => {
    mocks.tabsQuery.mockResolvedValue([{ id: 12 }, { id: 34 }]);
    await recordExtensionUpdate('update');

    await clearTabReloadRequirement(12);

    await expect(tabRequiresReload(12)).resolves.toBe(false);
    await expect(tabRequiresReload(34)).resolves.toBe(true);
  });

  test('does not mark existing tabs on a fresh install', async () => {
    mocks.tabsQuery.mockResolvedValue([{ id: 12 }]);

    await recordExtensionUpdate('install');

    expect(mocks.tabsQuery).not.toHaveBeenCalled();
    await expect(tabRequiresReload(12)).resolves.toBe(false);
  });
});
