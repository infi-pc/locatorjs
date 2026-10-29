import { afterEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  installShadowRootTracking: vi.fn(),
  startPageAgent: vi.fn(),
}));

vi.mock('@locator/shared', () => ({
  installSharedShadowRootTracking: mocks.installShadowRootTracking,
}));
vi.mock('./pageAgent', () => ({ startPageAgent: mocks.startPageAgent }));

afterEach(() => {
  vi.resetModules();
});

test('tracks closed shadow roots before the agent starts probing', async () => {
  await import('./index');

  expect(mocks.installShadowRootTracking).toHaveBeenCalledOnce();
  expect(mocks.startPageAgent).toHaveBeenCalledOnce();
  expect(
    mocks.installShadowRootTracking.mock.invocationCallOrder[0]
  ).toBeLessThan(
    mocks.startPageAgent.mock.invocationCallOrder[0] ?? Number.NEGATIVE_INFINITY
  );
});

test('never creates the React DevTools hook global', async () => {
  // React DevTools' installHook bails out with
  // `if (target.hasOwnProperty('__REACT_DEVTOOLS_GLOBAL_HOOK__')) return null;`
  // so an own property here, whatever its value, breaks the Components panel.
  await import('./index');

  expect(
    Object.prototype.hasOwnProperty.call(
      window,
      '__REACT_DEVTOOLS_GLOBAL_HOOK__'
    )
  ).toBe(false);
});
