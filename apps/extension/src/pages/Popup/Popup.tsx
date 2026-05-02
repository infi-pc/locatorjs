import { createSignal, Show } from 'solid-js';
import { Button, Spinner } from '@hope-ui/solid';
import { hope } from '@hope-ui/solid';
import { Home } from './Home';
import { EditControls } from './EditControls';
import { useSyncedState } from './syncedState';
import { Page } from './Page';
import SectionHeadline from './SectionHeadline';
import { BsGithub } from 'solid-icons/bs';

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
          <BsGithub /> <span class="underline">Readme.md: Troubleshooting</span>
        </hope.a>
        <hope.a
          target="_blank"
          class="flex gap-1 items-center"
          href="https://github.com/infi-pc/locatorjs/issues"
        >
          <BsGithub /> <span class="underline">GitHub issues</span>
        </hope.a>
      </div>
    </div>
  );
}

export default Popup;
