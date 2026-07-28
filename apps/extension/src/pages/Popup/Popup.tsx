import { createSignal, Show, Switch, Match } from 'solid-js';
import { Button, SectionHeadline, Spinner } from '@locator/ui';
import { ExternalLink, GitBranch, Power } from 'lucide-solid';
import { css } from '@locator/styled-system/css';
import { Home } from './Home';
import { Header } from './Header';
import { SettingsPage } from './SettingsPage';
import { useSyncedState } from './syncedState';
import { Page } from './Page';

const styles = {
  shell: css({ p: '4' }),
  stack: css({ display: 'flex', flexDirection: 'column', gap: '3' }),
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
  paragraphTitle: css({
    color: 'fg.default',
    fontSize: 'sm',
    fontWeight: 'medium',
    mt: '3',
  }),
  list: css({
    color: 'fg.muted',
    display: 'grid',
    fontSize: 'sm',
    gap: '1.5',
    pl: '4',
  }),
  link: css({ textDecoration: 'underline' }),
  helpful: css({ display: 'grid', gap: '1.5', mt: '3', pb: '1' }),
  iconLink: css({
    alignItems: 'center',
    color: 'accent.plain.fg',
    display: 'flex',
    fontSize: 'sm',
    gap: '1.5',
    _hover: { color: 'accent.solid.bg.hover' },
  }),
};

const Popup = () => {
  const [page, setPage] = createSignal<Page>({ type: 'home' });
  const { status, snapshot, setSiteLocal } = useSyncedState();

  const siteDisabled = () => !!snapshot()?.effective.disabled;

  return (
    <div class={styles.shell} style={{ '--locator-settings-tabs-top': '57px' }}>
      <Header page={page()} setPage={setPage} />
      <Show
        when={status() !== 'loading'}
        fallback={
          <div class={styles.loading}>
            <Spinner />
            <div class={styles.loadingText}>Loading...</div>
          </div>
        }
      >
        <Switch>
          <Match when={page().type === 'settings'}>
            <SettingsPage
              page={page() as Extract<Page, { type: 'settings' }>}
            />
          </Match>
          <Match when={page().type === 'home'}>
            <Show
              when={status() === 'connected'}
              fallback={<NoRuntimeView setPage={setPage} />}
            >
              <Show
                when={!siteDisabled()}
                fallback={
                  <div>
                    <div class={styles.card}>
                      <span class={styles.disabledIcon}>
                        <Power size={16} />
                      </span>
                      <SectionHeadline>Disabled</SectionHeadline>
                      <div class={styles.bodyText}>
                        LocatorJS is disabled on this page.
                      </div>
                      <div class={styles.actionRow}>
                        <Button
                          variant="primary"
                          onClick={() => setSiteLocal({ disabled: false })}
                        >
                          Enable
                        </Button>
                      </div>
                    </div>
                  </div>
                }
              >
                <Home setPage={setPage} />
              </Show>
            </Show>
          </Match>
        </Switch>
      </Show>
    </div>
  );
};

function NoRuntimeView(props: { setPage: (page: Page) => void }) {
  return (
    <div class={styles.stack}>
      <div class={styles.card}>
        <SectionHeadline>LocatorJS not detected on this page</SectionHeadline>
        <div class={styles.bodyText}>
          The extension is installed, but this tab is not exposing LocatorJS
          runtime data.
        </div>
        <div class={styles.actionRow}>
          <Button
            variant="ghost"
            onClick={() =>
              props.setPage({ type: 'settings', tab: 'user-extension' })
            }
          >
            Settings
          </Button>
        </div>
      </div>

      <div class={styles.card}>
        <p class={styles.paragraphTitle}>Supported setups</p>
        <ul class={styles.list}>
          <li>
            React in development mode with{' '}
            <a
              class={styles.link}
              href="https://babeljs.io/docs/en/babel-preset-react"
              target="_blank"
            >
              preset-react plugins
            </a>
          </li>
          <li>Vue 3 or Svelte in development mode</li>
          <li>React, SolidJS, or Preact with the Locator Babel plugin</li>
        </ul>
        <p class={styles.paragraphTitle}>Manual setup</p>
        <ul class={styles.list}>
          <li>
            <a
              class={styles.link}
              href="https://www.locatorjs.com/install/react-data-id"
              target="_blank"
            >
              React
            </a>
          </li>
          <li>
            <a
              class={styles.link}
              href="https://www.locatorjs.com/install/preact"
              target="_blank"
            >
              Preact
            </a>
          </li>
          <li>
            <a
              class={styles.link}
              href="https://www.locatorjs.com/install/solidjs"
              target="_blank"
            >
              SolidJS
            </a>
          </li>
          <li>
            <a
              class={styles.link}
              href="https://www.locatorjs.com/install/svelte"
              target="_blank"
            >
              Svelte
            </a>
          </li>
          <li>
            <a
              class={styles.link}
              href="https://www.locatorjs.com/install/vue"
              target="_blank"
            >
              Vue
            </a>
          </li>
        </ul>
      </div>

      <div class={styles.helpful}>
        <a
          target="_blank"
          class={styles.iconLink}
          href="https://github.com/infi-pc/locatorjs/blob/master/apps/extension/README.md#troubleshooting"
        >
          <GitBranch size={16} />
          <span>Troubleshooting</span>
          <ExternalLink size={14} />
        </a>
        <a
          target="_blank"
          class={styles.iconLink}
          href="https://github.com/infi-pc/locatorjs/issues"
        >
          <GitBranch size={16} />
          <span>GitHub issues</span>
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}

export default Popup;
