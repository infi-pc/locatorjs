import { beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  onMessage: vi.fn(),
  get: vi.fn(),
  initialize: vi.fn(),
}));
vi.mock('../../browser', () => ({
  default: {
    runtime: {
      id: 'locator-extension',
      onMessage: { addListener: mocks.onMessage },
      onInstalled: { addListener: vi.fn() },
    },
    storage: { local: { get: mocks.get } },
    tabs: {
      onUpdated: { addListener: vi.fn() },
      onRemoved: { addListener: vi.fn() },
    },
  },
}));
vi.mock('../../storageContract', () => ({
  ensureExtensionStorageReady: mocks.initialize,
}));
vi.mock('../../extensionUpdateState', () => ({
  clearTabReloadRequirement: vi.fn(),
  recordExtensionUpdate: vi.fn(),
}));

const request = { from: 'content', subject: 'documentOrigin' };
const origin = 'https://app.example';
const sender = {
  id: 'locator-extension',
  tab: { id: 7 },
  frameId: 0,
  origin,
};

function dispatch(message: unknown = request, identity: unknown = sender) {
  const sendResponse = vi.fn();
  const returned = mocks.onMessage.mock.calls[0][0](
    message,
    identity,
    sendResponse
  );
  // Older Chromium ignores returned Promises. Observe rejection only to keep
  // a broken listener from leaking an unhandled rejection in this harness.
  if (returned instanceof Promise) void returned.catch(() => undefined);
  return { returned, sendResponse };
}

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  mocks.get.mockResolvedValue({});
  await import('./index');
});

test('registers the listener without waiting for storage initialization', () => {
  expect(mocks.onMessage).toHaveBeenCalledOnce();
  expect(mocks.initialize).not.toHaveBeenCalled();
});

test.each([
  ['http://localhost:3000', {}, 'localhost'],
  [origin, { [`trustedOrigin:${origin}`]: true }, 'approved'],
  [origin, {}, 'approval-required'],
])(
  'answers %s through the callback (%s, %s)',
  async (value, stored, reason) => {
    mocks.get.mockResolvedValue(stored);
    const { returned, sendResponse } = dispatch(request, {
      ...sender,
      origin: value,
    });
    expect(returned).toBe(true);
    await vi.waitFor(() =>
      expect(sendResponse.mock.calls).toEqual([
        [
          {
            origin: value,
            access: { origin: value, reason },
          },
        ],
      ])
    );
  }
);

test.each([
  { ...sender, id: 'another-extension' },
  { ...sender, id: undefined },
  { ...sender, tab: undefined },
  { ...sender, tab: { id: '7' } },
  { ...sender, frameId: undefined },
  { ...sender, frameId: '0' },
])('rejects an unauthenticated sender: %j', (identity) => {
  const { returned, sendResponse } = dispatch(request, identity);
  expect(sendResponse.mock.calls).toEqual([[{ origin: null }]]);
  expect(returned).toBe(false);
  expect(mocks.get).not.toHaveBeenCalled();
});

test.each([origin, undefined])(
  'uses only browser-supplied origin (%s), ignoring payload and sender URL',
  async (value) => {
    const { returned, sendResponse } = dispatch(
      { ...request, origin: 'http://localhost:3000' },
      { ...sender, origin: value, url: 'http://localhost:3000' }
    );
    expect(returned).toBe(true);
    await vi.waitFor(() =>
      expect(sendResponse.mock.calls).toEqual([
        [
          {
            origin: value ?? null,
            access: {
              origin: value ?? null,
              reason: value ? 'approval-required' : 'unavailable',
            },
          },
        ],
      ])
    );
    if (value) expect(mocks.get).toHaveBeenCalledWith(`trustedOrigin:${value}`);
    else expect(mocks.get).not.toHaveBeenCalled();
  }
);

test.each([
  null,
  {},
  { ...request, subject: 'other' },
  { ...request, from: 'page' },
])('leaves unrelated messages to other listeners: %j', (message) => {
  const { returned, sendResponse } = dispatch(message);
  expect(returned).toBe(false);
  expect(sendResponse).not.toHaveBeenCalled();
  expect(mocks.get).not.toHaveBeenCalled();
});

test('answers unavailable when the origin lookup rejects', async () => {
  mocks.get.mockRejectedValue(new Error('Storage unavailable'));
  const { returned, sendResponse } = dispatch();
  expect(returned).toBe(true);
  await vi.waitFor(() =>
    expect(sendResponse.mock.calls).toEqual([[{ origin: null }]])
  );
});
