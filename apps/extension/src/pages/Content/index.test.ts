import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import type { OriginAccess } from '../../originAccess';

const mocks = vi.hoisted(() => ({
  sendMessage: vi.fn(),
  storageListener: vi.fn(),
  read: vi.fn(),
  bridge: vi.fn(),
}));
vi.mock('../../browser', () => ({
  default: {
    runtime: { sendMessage: mocks.sendMessage, getURL: () => '' },
    storage: { onChanged: { addListener: mocks.storageListener } },
  },
}));
vi.mock('./snapshotBridge', () => ({ mountSnapshotBridge: mocks.bridge }));
vi.mock('./migrateLegacyExtensionStorage', () => ({
  migrateLegacyExtensionStorage: async () => undefined,
}));
vi.mock('../../storageContract', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../storageContract')>()),
  readExtensionConfig: mocks.read,
}));

const origin = 'https://app.example';
const approved = { access: { origin, reason: 'approved' } };
const denied = { access: { origin, reason: 'approval-required' } };
const layer = { projectPath: '/private/initial' };
let removeWindowListeners: () => void;
const flush = async () => {
  // Drain the content entry's independent initialization promise chains.
  for (let turn = 0; turn < 12; turn++) await Promise.resolve();
};
const change = (changes: Record<string, unknown>) =>
  mocks.storageListener.mock.calls[0][0](changes, 'local');
const access = (): OriginAccess => mocks.bridge.mock.calls[0][0]();

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  mocks.read.mockResolvedValue({ kind: 'ready', revision: 0, layer });
  const added = vi.spyOn(window, 'addEventListener');
  removeWindowListeners = () => {
    for (const [type, listener, options] of added.mock.calls)
      window.removeEventListener(type, listener, options);
  };
  vi.spyOn(window, 'postMessage').mockImplementation(() => undefined);
  delete document.documentElement.dataset.locatorUserExtensionOptions;
});
afterEach(() => {
  removeWindowListeners();
  vi.restoreAllMocks();
});

test.each(['startup', 'refresh'])(
  '%s approval cannot overwrite revocation',
  async (phase) => {
    const stale = Promise.withResolvers<typeof approved>();
    mocks.sendMessage.mockResolvedValue(approved);
    if (phase === 'startup')
      mocks.sendMessage.mockReturnValueOnce(stale.promise);
    await import('./index');
    await flush();
    if (phase === 'refresh') {
      mocks.sendMessage.mockReturnValueOnce(stale.promise);
      change({ [`trustedOrigin:${origin}`]: { newValue: true } });
    }
    mocks.sendMessage.mockResolvedValue(denied);
    change({ [`trustedOrigin:${origin}`]: { oldValue: true } });
    await flush();
    stale.resolve(approved);
    await flush();
    change({
      userConfig: {
        newValue: {
          version: 3,
          revision: 1,
          layer: { projectPath: '/private/after-revoke' },
        },
      },
    });
    expect(access()).toEqual(denied.access);
    expect(
      document.documentElement.dataset.locatorUserExtensionOptions
    ).not.toContain('/private/');
  }
);

test('a failed refresh withholds settings and a later grant recovers', async () => {
  mocks.sendMessage.mockResolvedValue(approved);
  await import('./index');
  await flush();
  expect(
    document.documentElement.dataset.locatorUserExtensionOptions
  ).toContain(layer.projectPath);
  mocks.sendMessage.mockRejectedValueOnce(new Error('unavailable'));
  change({ [`trustedOrigin:${origin}`]: { oldValue: true } });
  await flush();
  expect(
    document.documentElement.dataset.locatorUserExtensionOptions
  ).not.toContain(layer.projectPath);
  change({ [`trustedOrigin:${origin}`]: { newValue: true } });
  await flush();
  expect(access()).toEqual(approved.access);
  expect(
    document.documentElement.dataset.locatorUserExtensionOptions
  ).toContain(layer.projectPath);
});
