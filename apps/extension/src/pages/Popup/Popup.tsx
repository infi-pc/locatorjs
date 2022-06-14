import { createEffect, createSignal } from 'solid-js';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  CloseButton,
  Spinner,
  Text,
} from '@hope-ui/solid';
import { hope } from '@hope-ui/solid';
import { Home } from './Home';
import { EditControls } from './EditControls';
import { requestStatus } from './requestStatus';
import { useSyncedState } from './syncedState';
import TrackingInit from './TrackingInit';
import SocialShare from './SocialShare';
import { Page } from './Page';
import { SharePage } from './SharePage';
import SectionHeadline from './SectionHeadline';
import { BsGithub } from 'solid-icons/bs';
import posthog from 'posthog-js';

const isMac =
  typeof navigator !== 'undefined' &&
  navigator.platform.toUpperCase().indexOf('MAC') >= 0;
export const altTitle = isMac ? '⌥ Option' : 'Alt';

const Popup = () => {
  const [message, setMessage] = createSignal<'loading' | 'ok' | string>(
    'loading'
  );
  const [page, setPage] = createSignal<Page>({ type: 'home' });

  const { allowTracking, clicks } = useSyncedState();

  requestStatus(setMessage);

  setInterval(() => {
    // Need to get the status periodically, needed when pages are loading slow + status can change after refresh.
    // I didn't find a reliable way to notify Popup from content without trowing an error.
    requestStatus(setMessage);
  }, 1000);

  createEffect(() => {
    const newMsg = message();
    if (newMsg == 'loading' || newMsg === 'ok') {
      return;
    }

    posthog.capture('Hook error', {
      message: newMsg,
    });
  });

  return (
    <>
      <div class="p-4">
        {allowTracking.get() === null ? (
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
            {message() === 'ok' ? (
              page().type === 'home' ? (
                <Home setPage={setPage} />
              ) : page().type === 'edit-controls' ? (
                <EditControls setPage={setPage} />
              ) : page().type === 'share' ? (
                // @ts-ignore
                <SharePage setPage={setPage} media={page().media} />
              ) : (
                <>No page</>
              )
            ) : message() === 'loading' ? (
              <div class="flex flex-col h-80 justify-center items-center gap-2">
                <Spinner></Spinner>
                <div class="text-lg">Loading...</div>
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
                      {message()
                        .split('\n')
                        .map((m) => (
                          <li>{m}</li>
                        ))}
                    </AlertDescription>
                  </Box>
                </Alert>

                <div class="mt-2">
                  <SectionHeadline>Helpful links:</SectionHeadline>
                  <hope.a
                    target="_blank"
                    class="flex gap-1 items-center"
                    href="https://github.com/infi-pc/locatorjs/blob/master/apps/extension/README.md#troubleshooting"
                  >
                    <BsGithub /> Readme.md: Troubleshooting
                  </hope.a>
                  <hope.a
                    target="_blank"
                    class="flex gap-1 items-center"
                    href="https://github.com/infi-pc/locatorjs/issues"
                  >
                    <BsGithub /> GitHub issues
                  </hope.a>
                </div>
              </div>
            )}
          </div>
        )}

        {allowTracking.get() === true && <TrackingInit />}
        {/* <p>
          Edit <code>src/pages/Popup/Popup.jsx</code> and save cool reload.
        </p>
        <a
          class="App-link"
          href="https://solidjs.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn Solid-JS!
        </a> */}
      </div>
      {clicks() > 2 && message() === 'ok' && page().type === 'home' && (
        <SocialShare setPage={setPage} />
      )}
    </>
  );
};

export default Popup;
