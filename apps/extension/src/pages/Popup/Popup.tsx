import './Popup.css';
import { createSignal } from 'solid-js';
import browser from '../../browser';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
} from '@hope-ui/solid';
import { css } from '@hope-ui/solid';
import { hope } from '@hope-ui/solid';
import { Home } from './Home';
import { EditControls } from './EditControls';

const isMac =
  typeof navigator !== 'undefined' &&
  navigator.platform.toUpperCase().indexOf('MAC') >= 0;
export const altTitle = isMac ? '⌥ Option' : 'Alt';

const Popup = () => {
  const [message, setMessage] = createSignal('');
  const [page, setPage] = createSignal<'home' | 'edit-controls'>('home');

  browser.tabs.query(
    {
      active: true,
      currentWindow: true,
    },
    (tabs) => {
      const currentTab = tabs[0];
      if (currentTab.id) {
        browser.tabs.sendMessage(
          currentTab.id,
          { from: 'popup', subject: 'statusMessage' },
          // ...also specifying a callback to be called
          //    from the receiving end (content script).
          function onStatusMessage(status) {
            if (status != 'ok') {
              setMessage(status);
            }
          }
        );
      }
    }
  );

  return (
    <div class="App">
      <div>
        {message() ? (
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
        ) : page() === 'home' ? (
          <Home setPage={setPage} />
        ) : page() === 'edit-controls' ? (
          <EditControls setPage={setPage} />
        ) : (
          <></>
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
