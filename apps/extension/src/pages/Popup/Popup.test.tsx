import { allTargets, DEFAULT_LAYER, resolve } from '@locator/shared';
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { Snapshot } from './syncedState';

const mocks = vi.hoisted(() => ({
  status: 'connected' as 'connected' | 'no-runtime',
  snapshot: null as unknown,
  userExtension: {},
  setUserExtension: vi.fn(async () => ({ ok: true as const })),
  setSiteLocal: vi.fn(async () => ({ ok: true as const })),
  clearSiteLocal: vi.fn(async () => ({ ok: true as const })),
  clearUserExtension: vi.fn(async () => ({ ok: true as const })),
  tryAction: vi.fn(async () => ({ ok: true as const })),
  createTab: vi.fn(),
}));

vi.mock('./syncedState', () => ({
  useSyncedState: () => ({
    status: () => mocks.status,
    snapshot: () => mocks.snapshot,
    userExtension: () => mocks.userExtension,
    setUserExtension: mocks.setUserExtension,
    setSiteLocal: mocks.setSiteLocal,
    clearSiteLocal: mocks.clearSiteLocal,
    clearUserExtension: mocks.clearUserExtension,
    tryAction: mocks.tryAction,
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

  test('selects interactions in place and preserves the selected site scope', async () => {
    render(() => <Popup />);

    expect(screen.queryByRole('button', { name: 'Settings' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Setup guide' })).toBeTruthy();
    expect(
      screen.getAllByRole('button', { name: /^Edit action/ })
    ).toHaveLength(4);

    await screen
      .getByRole('button', { name: 'Edit action 1: Open in editor' })
      .click();
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByLabelText('Selected interaction editor')).toBeTruthy();
    expect(
      screen.getByRole('combobox', { name: 'Settings scope' }).textContent
    ).toContain('This site');
    expect(
      screen.getByRole('heading', { name: 'Open in editor' })
    ).toBeTruthy();
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

    const scopeSelect = screen.getByRole('combobox', {
      name: 'Settings scope',
    });
    expect(scopeSelect.textContent).toContain('All sites');
    await scopeSelect.click();
    const listbox = await screen.findByRole('listbox');
    expect(
      screen
        .getByRole('option', { name: 'This site' })
        .getAttribute('aria-disabled')
    ).toBe('true');
    await fireEvent.keyDown(listbox, { key: 'Escape' });

    await screen
      .getByRole('button', { name: 'Edit action 1: Open in editor' })
      .click();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  test('resets the selected scope and keeps disable page-specific', async () => {
    render(() => <Popup />);

    await screen.getByRole('combobox', { name: 'Settings scope' }).click();
    const listbox = await screen.findByRole('listbox');
    await fireEvent.keyDown(listbox, { key: 'ArrowDown' });
    await fireEvent.keyDown(listbox, { key: 'Enter' });
    await screen.getByRole('button', { name: 'Reset' }).click();
    expect(screen.getByText('Reset your All sites defaults?')).toBeTruthy();
    await screen.getByRole('button', { name: 'Reset All sites' }).click();
    expect(mocks.clearUserExtension).toHaveBeenCalledTimes(1);
    expect(mocks.clearSiteLocal).not.toHaveBeenCalled();

    await screen.getByRole('button', { name: 'Disable on this page' }).click();
    expect(mocks.setSiteLocal).toHaveBeenCalledWith({ disabled: true });
  });
});
