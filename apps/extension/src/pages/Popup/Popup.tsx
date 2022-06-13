import './Popup.css';
import { createSignal } from 'solid-js';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Spinner,
} from '@hope-ui/solid';
import { hope } from '@hope-ui/solid';
import { Home } from './Home';
import { EditControls } from './EditControls';
import { requestStatus } from './requestStatus';

const isMac =
  typeof navigator !== 'undefined' &&
  navigator.platform.toUpperCase().indexOf('MAC') >= 0;
export const altTitle = isMac ? '⌥ Option' : 'Alt';

const Popup = () => {
  const [message, setMessage] = createSignal<'loading' | 'ok' | string>(
    'loading'
  );
  const [page, setPage] = createSignal<'home' | 'edit-controls'>('home');

  requestStatus(setMessage);

  setInterval(() => {
    // Need to get the status periodically, needed when pages are loading slow + status can change after refresh.
    // I didn't find a reliable way to notify Popup from content without trowing an error.
    requestStatus(setMessage);
  }, 1000);

  return (
    <div class="App">
      <div>
        {message() === 'ok' ? (
          page() === 'home' ? (
            <Home setPage={setPage} />
          ) : page() === 'edit-controls' ? (
            <EditControls setPage={setPage} />
          ) : (
            <>No page</>
          )
        ) : message() === 'loading' ? (
          <div class="flex flex-col h-80 justify-center items-center gap-2">
            <Spinner></Spinner>
            <div class="text-lg">Loading...</div>
            <div>
              This may take couple of seconds, depending how large is your page.
            </div>
          </div>
        ) : (
          <Alert status="danger" alignItems="flex-start">
            <AlertIcon mr="$2_5" mt="$2" />

            <Box flex="1">
              <AlertTitle>LocatorJS is not active on this page.</AlertTitle>
              <AlertDescription display="block">
                {message()
                  .split('\n')
                  .map((m) => (
                    <li>{m}</li>
                  ))}
              </AlertDescription>

              <hope.a
                target="_blank"
                href="https://github.com/infi-pc/locatorjs/blob/master/apps/extension/README.md#troubleshooting"
                css={{
                  color: '$danger12',
                  'text-decoration': 'underline',
                }}
              >
                How to solve it?
              </hope.a>
            </Box>
          </Alert>
        )}
      </div>
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
  );
};

export default Popup;
