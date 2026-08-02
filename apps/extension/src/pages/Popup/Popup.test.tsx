import { allTargets, DEFAULT_LAYER, resolve } from '@locator/shared';
import { cleanup, render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { Snapshot } from './syncedState';

const mocks = vi.hoisted(() => ({
  status: 'connected' as 'connected' | 'no-runtime',
  snapshot: null as unknown,
  userExtension: {},
  setUserExtension: vi.fn(async () => ({ ok: true as const })),
  setSiteLocal: vi.fn(async () => ({ ok: true as const })),
  createTab: vi.fn(),
}));

vi.mock('./syncedState', () => ({
  useSyncedState: () => ({
    status: () => mocks.status,
    snapshot: () => mocks.snapshot,
    userExtension: () => mocks.userExtension,
    setUserExtension: mocks.setUserExtension,
    setSiteLocal: mocks.setSiteLocal,
  }),
}));

vi.mock('../../browser', () => ({
  default: {
    tabs: { create: mocks.createTab },
    runtime: { getURL: (path: string) => `extension://${path}` },
  },
}));

import Popup from './Popup';

function connectedSnapshot(): Snapshot {
  const layers = {
    default: DEFAULT_LAYER,
    'user-extension': { projectPath: '/all-sites' },
    'user-origin': { projectPath: '/this-site' },
  };
  return {
    ...resolve(layers),
    layers,
    allTargets,
  };
}

describe('Popup settings navigation', () => {
  beforeEach(() => {
    mocks.status = 'connected';
    mocks.snapshot = connectedSnapshot();
    mocks.userExtension = { projectPath: '/all-sites' };
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  test('opens an action detail and preserves the selected site scope', async () => {
    render(() => <Popup />);

    expect(screen.queryByRole('button', { name: 'Settings' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Setup guide' })).toBeTruthy();
    expect(
      screen.getAllByRole('button', { name: /^Edit action/ })
    ).toHaveLength(4);

    await screen
      .getByRole('button', { name: 'Edit action 1: Open in VSCode' })
      .click();
    expect(
      screen.getByRole('button', { name: 'Back to actions' })
    ).toBeTruthy();
    expect(
      screen
        .getByRole('tab', { name: 'This site' })
        .getAttribute('aria-selected')
    ).toBe('true');
    expect(screen.getByText('Then')).toBeTruthy();

    await screen.getByRole('button', { name: 'Back to actions' }).click();
    expect(
      screen.getByRole('button', { name: 'Advanced settings' })
    ).toBeTruthy();
  });

  test('opens Advanced with configuration sources', async () => {
    render(() => <Popup />);

    await screen.getByRole('button', { name: 'Advanced settings' }).click();
    expect(screen.getByRole('heading', { name: 'Advanced' })).toBeTruthy();
    expect(screen.getByText('Configuration sources')).toBeTruthy();
    expect(screen.getByText(/Project path: \/this-site/)).toBeTruthy();
  });

  test('keeps All sites editable when no runtime is connected', async () => {
    mocks.status = 'no-runtime';
    mocks.snapshot = null;
    render(() => <Popup />);

    expect(
      screen.getByText('Page not connected — editing All sites.')
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Edit action 2: Tree view' })
    ).toBeTruthy();

    await screen
      .getByRole('button', { name: 'Edit action 1: Open in VSCode' })
      .click();
    expect(
      (screen.getByRole('tab', { name: 'This site' }) as HTMLButtonElement)
        .disabled
    ).toBe(true);
    expect(
      screen
        .getByRole('tab', { name: 'All sites' })
        .getAttribute('aria-selected')
    ).toBe('true');
  });
});
