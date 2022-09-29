import { createEffect, createSignal, For } from 'solid-js';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Spinner,
  Text,
} from '@hope-ui/solid';
import { hope } from '@hope-ui/solid';
import { Home } from './Home';
import { EditControls } from './EditControls';
import { requestStatus } from './requestStatus';
import { useSyncedState } from './syncedState';
import { Page } from './Page';
import { SharePage } from './SharePage';
import SectionHeadline from './SectionHeadline';
import { BsGithub } from 'solid-icons/bs';
// import posthog from 'posthog-js';
import { requestEnable } from './requestEnable';

const isMac =
  typeof navigator !== 'undefined' &&
  navigator.platform.toUpperCase().indexOf('MAC') >= 0;
export const altTitle = isMac ? '⌥ Option' : 'Alt';

type Message = 'loading' | 'ok' | `loading: ${string}` | string;

const Popup = () => {
  const [message, setMessage] = createSignal<Message>('loading');

  const [page, setPage] = createSignal<Page>({ type: 'home' });

  const { allowTracking } = useSyncedState();

  requestStatus(setMessage);

  setInterval(() => {
    // Need to get the status periodically, needed when pages are loading slow + status can change after refresh.
    // I didn't find a reliable way to notify Popup from content without trowing an error.
    requestStatus(setMessage);
  }, 1000);

  createEffect(() => {
    const newMsg = message();
    if (newMsg === 'ok' || newMsg.startsWith('loading')) {
      return;
    }

    // posthog.capture('Hook error', {
    //   message: newMsg,
    // });
  });

  function showTrackingPrompt() {
    // NOTE: we don't need tracting now
    // return allowTracking.get() === null
    return false;
  }

  return (
    <>
      <div class="p-4">
        {showTrackingPrompt() ? (
          <div class="p-2 flex flex-col justify-center items-center text-center h-60">
            <Text size="2xl" class=" mb-2">
              Allow anonymous tracking?
            </Text>

            <div class="ml-4">
              <p>
                We track only <b>this popup window</b>.
              </p>
              <p>We use the data for fixing bugs and improving UX</p>
            </div>
            <div class="flex gap-2 mt-4 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  allowTracking.set(false);
                }}
              >
                Do not track
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  allowTracking.set(true);
                }}
              >
                Allow anonymous tracking
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {message() === 'disabled' ? (
              <div>
                <SectionHeadline>Disabled</SectionHeadline>
                <div>You have disabled Locator on this page.</div>
                <div class="flex justify-end">
                  <Button
                    onClick={() => {
                      requestEnable(true);
                    }}
                  >
                    Enable
                  </Button>
                </div>
              </div>
            ) : message() === 'ok' ? (
              page().type === 'home' ? (
                <Home setPage={setPage} />
              ) : page().type === 'edit-controls' ? (
                <EditControls setPage={setPage} />
              ) : page().type === 'share' ? (
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                <SharePage setPage={setPage} media={page().media} />
              ) : (
                <>No page</>
              )
            ) : message().startsWith('loading') ? (
              <div class="flex flex-col h-80 justify-center items-center gap-2 text-center">
                <Spinner />
                <div class="text-lg">Loading...</div>
                <span class="text-red-700">{getLoadingMessage(message())}</span>
                <div>
                  This may take couple of seconds, depending how large is your
                  page.
                </div>
              </div>
            ) : (
              <div class="h-52">
                <div class="flex justify-between">
                  <SectionHeadline>Found errors</SectionHeadline>
                  {/* <CloseButton
                    onClick={() => {
                      setMessage('ok');
                    }}
                  /> */}
                </div>
                <Alert status="danger" alignItems="flex-start">
                  <AlertIcon mr="$2_5" mt="$2" />

                  <Box flex="1">
                    <AlertTitle>
                      LocatorJS could not run on this page
                    </AlertTitle>
                    <AlertDescription display="block">
                      <For each={message().split('\n')}>
                        {(m) => <li>{m}</li>}
                      </For>
                    </AlertDescription>
                  </Box>
                </Alert>

                <div class="">
                  <p class="font-medium mt-2">You need one of these:</p>
                  <ul class="pl-4">
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
                  <div>
                    <ul class="pl-4">
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
                  </div>
                </div>

                <div class="mt-2 pb-4">
                  <SectionHeadline>Helpful links:</SectionHeadline>
                  <hope.a
                    target="_blank"
                    class="flex gap-1 items-center"
                    href="https://github.com/infi-pc/locatorjs/blob/master/apps/extension/README.md#troubleshooting"
                  >
                    <BsGithub />{' '}
                    <span class="underline">Readme.md: Troubleshooting</span>
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
            )}
          </div>
        )}

        {/* // NOTE: we don't need tracking now */}
        {/* {allowTracking.get() === true && <TrackingInit />} */}
      </div>
    </>
  );
};

export default Popup;

function getLoadingMessage(msg: string) {
  if (msg.startsWith('loading: ')) {
    return msg.replace('loading: ', '');
  }
  return null;
}
