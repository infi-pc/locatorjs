import { expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  installShadowRootTracking: vi.fn(),
  installReactDevtoolsHook: vi.fn(),
  insertRuntimeScript: vi.fn(),
}));

vi.mock('@locator/shared', () => ({
  installSharedShadowRootTracking: mocks.installShadowRootTracking,
}));
vi.mock('@locator/react-devtools-hook', () => ({
  installReactDevtoolsHook: mocks.installReactDevtoolsHook,
}));
vi.mock('./insertRuntimeScript', () => ({
  insertRuntimeScript: mocks.insertRuntimeScript,
}));

test('tracks closed shadow roots before installing other page hooks', async () => {
  await import('./index');

  expect(mocks.installShadowRootTracking).toHaveBeenCalledOnce();
  const trackingOrder =
    mocks.installShadowRootTracking.mock.invocationCallOrder[0];
  const reactHookOrder =
    mocks.installReactDevtoolsHook.mock.invocationCallOrder[0];
  expect(trackingOrder).toEqual(expect.any(Number));
  expect(reactHookOrder).toEqual(expect.any(Number));
  expect(trackingOrder ?? Number.POSITIVE_INFINITY).toBeLessThan(
    reactHookOrder ?? Number.NEGATIVE_INFINITY
  );
  expect(mocks.insertRuntimeScript).toHaveBeenCalledOnce();
});
