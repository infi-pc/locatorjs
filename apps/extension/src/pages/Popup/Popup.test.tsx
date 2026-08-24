import { allTargets, DEFAULT_LAYER, resolve } from '@locator/shared';
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { ConnectivityStatus, Snapshot } from './syncedState';

const mocks = vi.hoisted(() => ({
  userExtension: {},
  setUserExtension: vi.fn(async () => ({ ok: true as const })),
  setSiteLocal: vi.fn(async () => ({ ok: true as const })),
  clearSiteLocal: vi.fn(async () => ({ ok: true as const })),
  clearUserExtension: vi.fn(async () => ({ ok: true as const })),
  tryAction: vi.fn(async () => ({ ok: true as const })),
  reloadActiveTab: vi.fn(async () => undefined),
  createTab: vi.fn(),
  // Assigned by the mock factory below. Connectivity is a signal so a test can
  // flip it mid-session, which is the only way to observe a remount.
  setStatus: undefined as unknown as (value: ConnectivityStatus) => void,
  setSnapshot: undefined as unknown as (value: Snapshot | null) => void,
}));

vi.mock('./syncedState', async () => {
  const { createSignal } = await import('solid-js');
  const [status, setStatus] = createSignal<ConnectivityStatus>('connected');
  const [snapshot, setSnapshot] = createSignal<Snapshot | null>(null);
  mocks.setStatus = setStatus;
  mocks.setSnapshot = (value) => setSnapshot(value);
  return {
    useSyncedState: () => ({
      status,
      diagnostic: () => undefined,
      snapshot,
      userExtension: () => mocks.userExtension,
      setUserExtension: mocks.setUserExtension,
      setSiteLocal: mocks.setSiteLocal,
      clearSiteLocal: mocks.clearSiteLocal,
      clearUserExtension: mocks.clearUserExtension,
      tryAction: mocks.tryAction,
      reloadActiveTab: mocks.reloadActiveTab,
    }),
  };
});

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
    mocks.setStatus('connected');
    mocks.setSnapshot(connectedSnapshot());
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
    mocks.setStatus('no-runtime');
    mocks.setSnapshot(null);
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

  test('reloads the active tab when an update requires it', async () => {
    mocks.setStatus('reload-required');
    mocks.setSnapshot(null);
    render(() => <Popup />);

    await screen.getByRole('button', { name: 'Reload page' }).click();

    expect(mocks.reloadActiveTab).toHaveBeenCalledTimes(1);
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

describe('Popup connectivity changes', () => {
  beforeEach(() => {
    mocks.setStatus('connected');
    mocks.setSnapshot(connectedSnapshot());
    mocks.userExtension = { projectPath: '/all-sites' };
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  const scopeLabel = () =>
    screen.getByRole('combobox', { name: 'Settings scope' }).textContent;

  test('a transient disconnect does not steal the chosen write scope', async () => {
    // `<Home/>` lived in both branches of the connectivity `<Show>`, so any
    // poll failure -- an HMR reload, a page missing the 1s reply timeout --
    // disposed and rebuilt it. "This site" then became "All sites" for good,
    // because the fallback only ever ran one way: the next save landed in the
    // wrong layer.
    render(() => <Popup />);
    expect(scopeLabel()).toContain('This site');

    mocks.setStatus('no-runtime');
    mocks.setSnapshot(null);
    expect(scopeLabel()).toContain('All sites');

    mocks.setStatus('connected');
    mocks.setSnapshot(connectedSnapshot());
    expect(scopeLabel()).toContain('This site');
  });

  test('an explicit All sites choice survives a reconnect', async () => {
    render(() => <Popup />);

    await screen.getByRole('combobox', { name: 'Settings scope' }).click();
    const listbox = await screen.findByRole('listbox');
    await fireEvent.keyDown(listbox, { key: 'ArrowDown' });
    await fireEvent.keyDown(listbox, { key: 'Enter' });
    expect(scopeLabel()).toContain('All sites');

    mocks.setStatus('no-runtime');
    mocks.setSnapshot(null);
    mocks.setStatus('connected');
    mocks.setSnapshot(connectedSnapshot());

    expect(scopeLabel()).toContain('All sites');
  });

  test('reconnecting does not rebuild the settings UI either', async () => {
    render(() => <Popup />);
    const before = screen.getByRole('combobox', { name: 'Settings scope' });

    mocks.setStatus('no-runtime');
    mocks.setSnapshot(null);
    mocks.setStatus('connected');
    mocks.setSnapshot(connectedSnapshot());

    expect(screen.getByRole('combobox', { name: 'Settings scope' })).toBe(
      before
    );
  });
});
