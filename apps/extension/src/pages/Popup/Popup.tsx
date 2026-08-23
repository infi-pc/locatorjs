import { Show, createSignal } from 'solid-js';
import { Button, SectionHeadline, Spinner } from '@locator/ui';
import { Power } from 'lucide-solid';
import { css } from '@locator/styled-system/css';
import { Home } from './Home';
import { Header } from './Header';
import { useSyncedState } from './syncedState';

const styles = {
  shell: css({ p: '3' }),
  stack: css({ display: 'flex', flexDirection: 'column', gap: '2' }),
  card: css({ layerStyle: 'card', p: '3' }),
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
  bodyText: css({ color: 'fg.muted', fontSize: 'sm', mt: '1' }),
  actionRow: css({ display: 'flex', justifyContent: 'flex-end', mt: '3' }),
  notice: css({ color: 'fg.muted', fontSize: 'xs', px: '1' }),
  error: css({ color: 'red.plain.fg', fontSize: 'xs', mt: '2' }),
  disabledIcon: css({
    alignItems: 'center',
    bg: 'red.subtle.bg',
    borderColor: 'red.surface.border',
    borderRadius: 'l2',
    borderWidth: '1px',
    color: 'red.subtle.fg',
    display: 'inline-flex',
    height: '8',
    justifyContent: 'center',
    mb: '2',
    width: '8',
  }),
};

const Popup = () => {
  const { status, snapshot, setSiteLocal } = useSyncedState();
  const [enableError, setEnableError] = createSignal<string>();

  const siteDisabled = () => !!snapshot()?.effective.disabled;

  // A page with third-party storage blocked, or storage at quota, resolves this
  // write to `{ ok: false }`. Dropping it left the button looking like it had
  // worked while the overlay stayed disabled.
  const enableHere = async () => {
    const result = await setSiteLocal({ disabled: false });
    setEnableError(
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
          `<Home/>` is mounted once, outside the connectivity branches. Having
          it in both branches of a `<Show>` made any transient poll failure --
          an HMR reload, a page that misses the 1s reply timeout -- dispose and
          rebuild the whole settings UI: open dialogs closed, in-flight edits
          were discarded, and the write scope silently reset from "This site"
          to "All sites" so the next save landed in the wrong layer.
        */}
        <div class={styles.stack}>
          <Show when={status() !== 'connected'}>
            <NoRuntimeView />
          </Show>
          <Show when={status() === 'connected' && siteDisabled()}>
            <div class={styles.card}>
              <span class={styles.disabledIcon}>
                <Power size={16} />
              </span>
              <SectionHeadline>Disabled</SectionHeadline>
              <div class={styles.bodyText}>
                LocatorJS is disabled on this page.
              </div>
              <div class={styles.actionRow}>
                <Button variant="primary" onClick={enableHere}>
                  Enable
                </Button>
              </div>
              <Show when={enableError()}>
                <div class={styles.error} role="alert">
                  {enableError()}
                </div>
              </Show>
            </div>
          </Show>
          <Home />
        </div>
      </Show>
    </div>
  );
};

function NoRuntimeView() {
  return (
    <div class={styles.notice}>Page not connected — editing All sites.</div>
  );
}

export default Popup;
