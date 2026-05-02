import { createSignal, Show } from 'solid-js';
import { Button, Spinner } from '@hope-ui/solid';
import { hope } from '@hope-ui/solid';
import { Home } from './Home';
import { EditControls } from './EditControls';
import { useSyncedState } from './syncedState';
import { Page } from './Page';
import SectionHeadline from './SectionHeadline';
function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.26.82-.578 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.082-.73.082-.73 1.205.085 1.838 1.236 1.838 1.236 1.07 1.835 2.81 1.305 3.495.998.108-.776.42-1.305.762-1.605-2.665-.305-5.467-1.332-5.467-5.93 0-1.31.467-2.382 1.235-3.222-.135-.302-.54-1.524.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.652.24 2.874.12 3.176.765.84 1.23 1.912 1.23 3.222 0 4.61-2.805 5.62-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

const isMac =
  typeof navigator !== 'undefined' &&
  navigator.platform.toUpperCase().indexOf('MAC') >= 0;
export const altTitle = isMac ? '⌥ Option' : 'Alt';

const Popup = () => {
  const [page, setPage] = createSignal<Page>({ type: 'home' });
  const { status, snapshot, setSiteLocal } = useSyncedState();

  const siteDisabled = () => !!snapshot()?.effective.disabled;

  return (
    <div class="p-4">
      <Show
        when={status() !== 'loading'}
        fallback={
          <div class="flex flex-col h-80 justify-center items-center gap-2 text-center">
            <Spinner />
            <div class="text-lg">Loading...</div>
          </div>
        }
      >
        <Show when={status() === 'connected'} fallback={<NoRuntimeView />}>
          <Show
            when={!siteDisabled()}
            fallback={
              <div>
                <SectionHeadline>Disabled</SectionHeadline>
                <div>You have disabled Locator on this page.</div>
                <div class="flex justify-end">
                  <Button onClick={() => setSiteLocal({ disabled: false })}>
                    Enable
                  </Button>
                </div>
              </div>
            }
          >
            {page().type === 'home' ? (
              <Home setPage={setPage} />
            ) : page().type === 'edit-controls' ? (
              <EditControls setPage={setPage} />
            ) : (
              <>No page</>
            )}
          </Show>
        </Show>
      </Show>
    </div>
  );
};

function NoRuntimeView() {
  return (
    <div class="h-52">
      <div class="flex justify-between">
        <SectionHeadline>LocatorJS not detected on this page</SectionHeadline>
      </div>
      <p class="font-medium mt-2">You need one of these:</p>
      <ul class="pl-4 text-sm">
        <li>
          Working React in development mode, with{' '}
          <a
            class="underline"
            href="https://babeljs.io/docs/en/babel-preset-react"
            target="_blank"
          >
            preset-react plugins
          </a>
        </li>
        <li>Vue3 or Svelte in development mode</li>
        <li>React, SolidJS or Preact with Locator Babel plugin</li>
      </ul>
      <p class="font-medium mt-2">Setup manually:</p>
      <ul class="pl-4 text-sm">
        <li>
          <a
            class="underline"
            href="https://www.locatorjs.com/install/react-data-id"
            target="_blank"
          >
            React
          </a>
        </li>
        <li>
          <a
            class="underline"
            href="https://www.locatorjs.com/install/preact"
            target="_blank"
          >
            Preact
          </a>
        </li>
        <li>
          <a
            class="underline"
            href="https://www.locatorjs.com/install/solidjs"
            target="_blank"
          >
            SolidJS
          </a>
        </li>
        <li>
          <a
            class="underline"
            href="https://www.locatorjs.com/install/svelte"
            target="_blank"
          >
            Svelte
          </a>
        </li>
        <li>
          <a
            class="underline"
            href="https://www.locatorjs.com/install/vue"
            target="_blank"
          >
            Vue
          </a>
        </li>
      </ul>
      <div class="mt-2 pb-4">
        <SectionHeadline>Helpful links:</SectionHeadline>
        <hope.a
          target="_blank"
          class="flex gap-1 items-center"
          href="https://github.com/infi-pc/locatorjs/blob/master/apps/extension/README.md#troubleshooting"
        >
          <GithubIcon />{' '}
          <span class="underline">Readme.md: Troubleshooting</span>
        </hope.a>
        <hope.a
          target="_blank"
          class="flex gap-1 items-center"
          href="https://github.com/infi-pc/locatorjs/issues"
        >
          <GithubIcon /> <span class="underline">GitHub issues</span>
        </hope.a>
      </div>
    </div>
  );
}

export default Popup;
