import { Show, createSignal } from 'solid-js';
import { PageStatusCard, Spinner, type PageStatusScreen } from '@locator/ui';
import { css } from '@locator/styled-system/css';
import { Home } from './Home';
import { Header } from './Header';
import { useSyncedState, type ConnectivityStatus } from './syncedState';
import type { PageStatus } from '@locator/shared';

const styles = {
  shell: css({ p: '3' }),
  stack: css({ display: 'flex', flexDirection: 'column', gap: '2' }),
  loading: css({
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '2',
    height: '80',
    justifyContent: 'center',
    textAlign: 'center',
  }),
  loadingText: css({ fontSize: 'lg' }),
};

/**
 * The one card above the settings, or none when the page is simply connected.
 *
 * The page agent's status explains why the client is not running; the popup
 * adds what only it can know — whether a content script answered at all, and
 * whether the extension updated under the tab.
 */
function pageStatusScreen(input: {
  status: ConnectivityStatus;
  pageStatus: PageStatus | null;
  contentReachable: boolean;
  siteDisabled: boolean;
}): PageStatusScreen | null {
  if (input.status === 'loading') return null;
  if (input.status === 'reload-required') return { kind: 'reload-required' };
  if (input.status === 'connected') {
    return input.siteDisabled ? { kind: 'disabled-here' } : null;
  }
  const page = input.pageStatus;
  if (!page) {
    return input.contentReachable
      ? { kind: 'probing' }
      : { kind: 'restricted-page' };
  }
  switch (page.kind) {
    case 'ready':
      return { kind: 'runtime-unreachable' };
    case 'disabled':
      return { kind: 'disabled-everywhere' };
    case 'probing':
    case 'no-framework':
    case 'no-source-info':
    case 'client-failed':
      return page;
  }
}

const Popup = () => {
  const {
    status,
    snapshot,
    pageStatus,
    contentReachable,
    setSiteLocal,
    setUserExtension,
    reloadActiveTab,
    requestProbe,
  } = useSyncedState();
  const [actionError, setActionError] = createSignal<string>();
  const [busy, setBusy] = createSignal(false);

  const screen = () =>
    pageStatusScreen({
      status: status(),
      pageStatus: pageStatus(),
      contentReachable: contentReachable(),
      siteDisabled: !!snapshot()?.effective.disabled,
    });

  // A page with third-party storage blocked, or storage at quota, resolves this
  // write to `{ ok: false }`. Dropping it left the button looking like it had
  // worked while the overlay stayed disabled.
  const enable = async () => {
    setBusy(true);
    const result =
      screen()?.kind === 'disabled-everywhere'
        ? await setUserExtension({ set: { disabled: false } })
        : await setSiteLocal({ set: { disabled: false } });
    setBusy(false);
    setActionError(
      result.ok ? undefined : 'Could not enable LocatorJS on this page.'
    );
  };

  return (
    <div class={styles.shell} style={{ '--locator-settings-tabs-top': '57px' }}>
      <Header />
      <Show
        when={status() !== 'loading'}
        fallback={
          <div class={styles.loading}>
            <Spinner />
            <div class={styles.loadingText}>Loading...</div>
          </div>
        }
      >
        {/*
          `<Home/>` is mounted once, outside the status branches. Having it in
          both branches of a `<Show>` made any transient poll failure -- an HMR
          reload, a page that misses the 1s reply timeout -- dispose and rebuild
          the whole settings UI: open dialogs closed, in-flight edits were
          discarded, and the write scope silently reset from "This site" to
          "All sites" so the next save landed in the wrong layer.
        */}
        <div class={styles.stack}>
          <Show when={screen()}>
            {(current) => (
              <PageStatusCard
                screen={current()}
                busy={busy()}
                error={actionError()}
                onCheckAgain={() => void requestProbe()}
                onEnable={() => void enable()}
                onReload={() => void reloadActiveTab()}
              />
            )}
          </Show>
          <Home />
        </div>
      </Show>
    </div>
  );
};

export default Popup;
