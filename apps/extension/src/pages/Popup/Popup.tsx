import './Popup.css';
import { createSignal } from 'solid-js';
import { Editor } from './Editor';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
} from '@hope-ui/solid';
import { css } from '@hope-ui/solid';
import { hope } from '@hope-ui/solid';

const isMac =
  typeof navigator !== 'undefined' &&
  navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const altTitle = isMac ? '⌥ Option' : 'Alt';

const Popup = () => {
  const [message, setMessage] = createSignal('');

  chrome.tabs.query(
    {
      active: true,
      currentWindow: true,
    },
    (tabs) => {
      const currentTab = tabs[0];
      if (currentTab.id) {
        chrome.tabs.sendMessage(
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
        ) : (
          <div class="flex justify-between">
            <div>
              <label class="text-lg font-medium text-gray-900 mb-4">
                Controls:{' '}
              </label>

              <div class="locatorjs-line">
                <b>
                  <span class="locatorjs-key">{altTitle}</span> +{' '}
                  <span class="locatorjs-key">
                    <svg
                      viewBox="0 0 24 24"
                      style={{
                        width: '14px',
                        height: '14px',
                        display: 'inline-block',
                      }}
                    >
                      <path
                        fill="currentColor"
                        d="M11,1.07C7.05,1.56 4,4.92 4,9H11M4,15A8,8 0 0,0 12,23A8,8 0 0,0 20,15V11H4M13,1.07V9H20C20,4.92 16.94,1.56 13,1.07Z"
                      />
                    </svg>{' '}
                    click
                  </span>
                </b>{' '}
                go to editor
              </div>
              <div class="locatorjs-line">
                <b>
                  <span class="locatorjs-key">{altTitle}</span> +{' '}
                  <span class="locatorjs-key">D</span>
                </b>{' '}
                toggle select mode
              </div>
              <p class="text-xs leading-5 text-gray-800">
                remember to <b>focus your app</b> (click on any surface)
              </p>
            </div>
            <div>
              <Button color="neutral" variant="subtle">
                edit controls
              </Button>
            </div>
          </div>
        )}

        <Editor />
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
