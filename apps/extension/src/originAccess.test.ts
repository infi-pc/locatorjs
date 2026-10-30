import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('./browser', () => ({
  default: {
    storage: { local: mocks },
  },
}));

import {
  canonicalHttpOrigin,
  canSharePrivateSettings,
  getOriginAccess,
} from './originAccess';
import { grantOrigin, revokeOrigin } from './originTrust';

describe('origin access policy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.get.mockResolvedValue({});
    mocks.set.mockResolvedValue(undefined);
    mocks.remove.mockResolvedValue(undefined);
  });

  test.each([
    ['http://localhost:3000', 'http://localhost:3000', 'localhost'],
    ['https://localhost:443/path', 'https://localhost', 'localhost'],
    ['http://localhost.', 'http://localhost.', 'approval-required'],
    ['http://127.0.0.1:3000', 'http://127.0.0.1:3000', 'approval-required'],
    [
      'http://app.localhost:3000',
      'http://app.localhost:3000',
      'approval-required',
    ],
  ])('classifies %s as %s', async (input, origin, reason) => {
    expect(await getOriginAccess(input)).toEqual({ origin, reason });
    expect(canSharePrivateSettings(await getOriginAccess(input))).toBe(
      reason === 'localhost'
    );
  });

  test('requires an exact origin grant and persists one key', async () => {
    mocks.get.mockResolvedValue({ 'trustedOrigin:https://example.test': true });
    expect(await getOriginAccess('https://example.test/path')).toEqual({
      origin: 'https://example.test',
      reason: 'approved',
    });
    expect(await getOriginAccess('https://example.test:443/other')).toEqual({
      origin: 'https://example.test',
      reason: 'approved',
    });
    await grantOrigin('https://example.test/path');
    await revokeOrigin('https://example.test');
    expect(mocks.set).toHaveBeenCalledWith({
      'trustedOrigin:https://example.test': true,
    });
    expect(mocks.remove).toHaveBeenCalledWith(
      'trustedOrigin:https://example.test'
    );
  });

  test('rejects unavailable and non-http identities', async () => {
    expect(canonicalHttpOrigin(undefined)).toBeNull();
    expect(canonicalHttpOrigin('null')).toBeNull();
    expect(await getOriginAccess('file:///tmp/index.html')).toEqual({
      origin: null,
      reason: 'unavailable',
    });
  });
});
