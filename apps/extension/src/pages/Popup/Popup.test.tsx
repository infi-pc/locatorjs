import { strictConfig } from '@locator/shared';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { PageStatus, WriteResult } from '@locator/shared';
import type { ConnectivityStatus, Snapshot } from './syncedState';

const mocks = vi.hoisted(() => ({
  userExtension: {},
  setUserExtension: vi.fn(async () => ({ ok: true as const })),
  setSiteLocal: vi.fn(async (): Promise<WriteResult> => ({ ok: true })),
  clearSiteLocal: vi.fn(async () => ({ ok: true as const })),
  clearUserExtension: vi.fn(async () => ({ ok: true as const })),
  tryAction: vi.fn(async () => ({ ok: true as const })),
  reloadActiveTab: vi.fn(async () => undefined),
  requestProbe: vi.fn(async () => undefined),
  createTab: vi.fn(),
  // Assigned by the mock factory below. Connectivity is a signal so a test can
  // flip it mid-session, which is the only way to observe a remount.
  setStatus: undefined as unknown as (value: ConnectivityStatus) => void,
  setSnapshot: undefined as unknown as (value: Snapshot | null) => void,
  setPageStatus: undefined as unknown as (value: PageStatus | null) => void,
  setContentReachable: undefined as unknown as (value: boolean) => void,
  setSiteLocalPresent: undefined as unknown as (value: boolean) => void,
}));

vi.mock('./syncedState', async () => {
  const { createSignal } = await import('solid-js');
  const [status, setStatus] = createSignal<ConnectivityStatus>('connected');
  const [snapshot, setSnapshot] = createSignal<Snapshot | null>(null);
  const [pageStatus, setPageStatus] = createSignal<PageStatus | null>(null);
  const [contentReachable, setContentReachable] = createSignal(false);
  const [siteLocalPresent, setSiteLocalPresent] = createSignal(false);
  mocks.setStatus = setStatus;
  mocks.setSnapshot = (value) => setSnapshot(value);
  mocks.setPageStatus = setPageStatus;
  mocks.setContentReachable = setContentReachable;
  mocks.setSiteLocalPresent = setSiteLocalPresent;
  return {
    useSyncedState: () => ({
      status,
      pageStatus,
      contentReachable,
      siteLocalPresent,
      snapshot,
      extensionConfigRead: () => ({ kind: 'empty' as const }),
      userExtension: () => mocks.userExtension,
      setUserExtension: mocks.setUserExtension,
      setSiteLocal: mocks.setSiteLocal,
      clearSiteLocal: mocks.clearSiteLocal,
      clearUserExtension: mocks.clearUserExtension,
      tryAction: mocks.tryAction,
      reloadActiveTab: mocks.reloadActiveTab,
      requestProbe: mocks.requestProbe,
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
    default: strictConfig.encodeLayer(strictConfig.DEFAULT_LAYER),
    'user-extension': { projectPath: '/all-sites' },
    'user-origin': { projectPath: '/this-site' },
  };
  const extension = strictConfig.parseLayer(layers['user-extension']);
  const origin = strictConfig.parseLayer(layers['user-origin']);
  if (!extension.ok || !origin.ok) throw new Error('Invalid popup fixture.');
  const resolved = strictConfig.resolveConfig(
    {
      default: strictConfig.DEFAULT_LAYER,
      'user-extension': extension.value,
      'user-origin': origin.value,
    },
    strictConfig.BUILT_IN_TARGETS
  );
  return {
    effective: strictConfig.effectiveOptionsView(
      strictConfig.effectiveOptions(resolved)
    ),
    provenance: strictConfig.configProvenance(resolved),
    layers,
    allTargets: strictConfig.targetRegistryView(strictConfig.BUILT_IN_TARGETS),
  };
}

const PAGE_TEMPLATE = 'https://page.example/source?file=${filePath}';

function pageTargetSnapshot(): Snapshot {
  const snapshot = connectedSnapshot();
  return {
    ...snapshot,
    layers: {
      ...snapshot.layers,
      team: { editor: { kind: 'target', id: 'page-editor' } },
      'user-origin': {
        editor: { kind: 'target', id: 'page-editor' },
        projectPath: '/this-site',
      },
    },
    allTargets: {
      vscode: { label: 'VSCode', url: PAGE_TEMPLATE },
      'page-editor': { label: 'Page editor', url: PAGE_TEMPLATE },
    },
  };
}

async function chooseScope(label: 'This site' | 'All sites') {
  await screen.getByRole('combobox', { name: 'Settings scope' }).click();
  await fireEvent.click(await screen.findByRole('option', { name: label }));
}

describe('Popup settings navigation', () => {
  beforeEach(() => {
    mocks.setStatus('connected');
    mocks.setSnapshot(connectedSnapshot());
    mocks.userExtension = { projectPath: '/all-sites' };
    mocks.setPageStatus(null);
    mocks.setContentReachable(false);
    mocks.setSiteLocalPresent(false);
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  test('All sites customizes its trusted editor instead of the page target', async () => {
    mocks.userExtension = { editor: { kind: 'target', id: 'vscode' } };
    mocks.setSnapshot(pageTargetSnapshot());
    render(() => <Popup />);

    await chooseScope('All sites');
    await screen
      .getByRole('button', { name: 'Customize link template' })
      .click();
    await fireEvent.keyDown(
      screen.getByRole('textbox', { name: 'Custom link template' }),
      { key: 'Enter' }
    );

    await waitFor(() =>
      expect(mocks.setUserExtension).toHaveBeenCalledWith({
        set: {
          editor: {
            kind: 'template',
            template: strictConfig.targetRegistryView(
              strictConfig.BUILT_IN_TARGETS
            ).vscode.url,
          },
        },
      })
    );
    expect(mocks.setSiteLocal).not.toHaveBeenCalled();
  });

  test('switching to All sites discards the page-seeded custom editor draft', async () => {
    mocks.userExtension = { editor: { kind: 'target', id: 'vscode' } };
    mocks.setSnapshot(pageTargetSnapshot());
    render(() => <Popup />);

    await screen
      .getByRole('button', { name: 'Customize link template' })
      .click();
    expect(
      (
        screen.getByRole('textbox', {
          name: 'Custom link template',
        }) as HTMLInputElement
      ).value
    ).toBe(PAGE_TEMPLATE);
    await chooseScope('All sites');

    expect(
      screen.queryByRole('textbox', { name: 'Custom link template' })
    ).toBeNull();
    expect(mocks.setUserExtension).not.toHaveBeenCalled();
    expect(mocks.setSiteLocal).not.toHaveBeenCalled();

    await screen
      .getByRole('button', { name: 'Customize link template' })
      .click();
    const input = screen.getByRole('textbox', { name: 'Custom link template' });
    const manualTemplate = 'https://my-editor.example/open?file=${filePath}';
    await fireEvent.input(input, { target: { value: manualTemplate } });
    await fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() =>
      expect(mocks.setUserExtension).toHaveBeenCalledWith({
        set: { editor: { kind: 'template', template: manualTemplate } },
      })
    );
  });

  test('an unset All sites editor stays unset while This site keeps its custom target', async () => {
    mocks.userExtension = {};
    mocks.setSnapshot(pageTargetSnapshot());
    render(() => <Popup />);

    expect(
      screen.getByRole('combobox', { name: 'Editor' }).textContent
    ).toContain('Page editor');
    await chooseScope('All sites');
    expect(
      screen.getByRole('combobox', { name: 'Editor' }).textContent
    ).toContain('Select editor');
    expect(
      screen.getByText('Pick an editor so source links can open.')
    ).toBeTruthy();
    expect(mocks.setUserExtension).not.toHaveBeenCalled();

    await screen.getByRole('button', { name: 'Advanced settings' }).click();
    expect(
      (
        screen.getByRole('textbox', {
          name: 'Project path',
        }) as HTMLInputElement
      ).value
    ).toBe('');
    expect(screen.getByText(/Project path: \/this-site/)).toBeTruthy();
    await screen.getByRole('button', { name: 'Back to interactions' }).click();
    await chooseScope('This site');
    await screen.getByRole('combobox', { name: 'Editor' }).click();
    await fireEvent.click(
      await screen.findByRole('option', { name: 'Page editor' })
    );
    await screen
      .getByRole('button', { name: 'Customize link template' })
      .click();
    await fireEvent.keyDown(
      screen.getByRole('textbox', { name: 'Custom link template' }),
      { key: 'Enter' }
    );
    await waitFor(() =>
      expect(mocks.setSiteLocal).toHaveBeenCalledWith({
        set: { editor: { kind: 'template', template: PAGE_TEMPLATE } },
      })
    );
    expect(mocks.setUserExtension).not.toHaveBeenCalled();
  });

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

    expect(screen.getByText("Locator can't run here")).toBeTruthy();
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

  test('shows the page agent status while the client is not running', () => {
    mocks.setStatus('no-runtime');
    mocks.setSnapshot(null);
    mocks.setContentReachable(true);
    const view = render(() => <Popup />);

    expect(screen.getByText('Looking for your app…')).toBeTruthy();

    mocks.setPageStatus({ kind: 'no-framework', unsupported: ['Angular'] });
    expect(
      screen.getByText('No supported framework on this page')
    ).toBeTruthy();
    expect(screen.getByText(/This looks like an Angular app/)).toBeTruthy();
    screen.getByRole('button', { name: 'Check again' }).click();
    expect(mocks.requestProbe).toHaveBeenCalledTimes(1);

    mocks.setPageStatus({ kind: 'no-source-info', frameworks: ['react'] });
    expect(
      screen.getByText('React is here, but without source locations')
    ).toBeTruthy();

    mocks.setPageStatus({ kind: 'client-failed', detail: 'CSP said no' });
    expect(
      screen.getByText("Locator couldn't start on this page")
    ).toBeTruthy();
    expect(screen.getByText('CSP said no')).toBeTruthy();

    mocks.setPageStatus({ kind: 'ready', adapter: 'react', frameworks: [] });
    expect(screen.getByText("The page didn't answer")).toBeTruthy();
    view.unmount();
  });

  test('turns Locator back on for all sites from the disabled screen', async () => {
    mocks.setStatus('no-runtime');
    mocks.setSnapshot(null);
    mocks.setContentReachable(true);
    mocks.setPageStatus({ kind: 'disabled' });
    render(() => <Popup />);

    expect(
      screen.getByText('Locator is turned off for all sites')
    ).toBeTruthy();
    await screen.getByRole('button', { name: 'Turn on' }).click();
    expect(mocks.setUserExtension).toHaveBeenCalledWith({
      set: { disabled: false },
    });
    expect(mocks.setSiteLocal).not.toHaveBeenCalled();
  });

  test('turns Locator back on for this site and reports a failed write', async () => {
    mocks.setSiteLocal.mockResolvedValueOnce({ ok: false, reason: 'quota' });
    const snapshot = connectedSnapshot();
    mocks.setSnapshot({
      ...snapshot,
      effective: { ...snapshot.effective, disabled: true },
    });
    render(() => <Popup />);

    expect(screen.getByText('Disabled on this page')).toBeTruthy();
    await screen.getByRole('button', { name: 'Turn on' }).click();
    expect(mocks.setSiteLocal).toHaveBeenCalledWith({
      set: { disabled: false },
    });
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain(
        'Could not enable LocatorJS on this page.'
      )
    );
  });

  test('names the framework in the footer when connected', () => {
    mocks.setPageStatus({ kind: 'ready', adapter: 'vue', frameworks: ['vue'] });
    render(() => <Popup />);
    expect(screen.getByText('Connected · Vue')).toBeTruthy();
  });

  test('keeps recovery for rejected site settings available', async () => {
    mocks.setStatus('no-runtime');
    mocks.setSnapshot(null);
    mocks.setSiteLocalPresent(true);
    render(() => <Popup />);

    expect(
      screen.getByText('Site settings were detected and can still be reset.')
    ).toBeTruthy();
    await screen.getByRole('button', { name: 'Reset' }).click();
    expect(screen.getByText('Reset settings for this site?')).toBeTruthy();
    await screen.getByRole('button', { name: 'Reset This site' }).click();
    expect(mocks.clearSiteLocal).toHaveBeenCalledTimes(1);
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
    expect(mocks.setSiteLocal).toHaveBeenCalledWith({
      set: { disabled: true },
    });
  });
});

describe('Popup connectivity changes', () => {
  beforeEach(() => {
    mocks.setStatus('connected');
    mocks.setSnapshot(connectedSnapshot());
    mocks.userExtension = { projectPath: '/all-sites' };
    mocks.setPageStatus(null);
    mocks.setContentReachable(false);
    mocks.setSiteLocalPresent(false);
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
