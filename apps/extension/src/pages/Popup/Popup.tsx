import './Popup.css';
import { createSignal } from 'solid-js';
import { Editor } from './Editor';
import browser from '../../browser';

const isMac =
  typeof navigator !== 'undefined' &&
  navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const altTitle = isMac ? '⌥ Option' : 'Alt';

const Popup = () => {
  const [message, setMessage] = createSignal('');

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
          <div class="p-4 rounded-md bg-red-50">
            <div class="flex">
              <div class="flex-shrink-0 h-5 w-5 text-red-400">
                <svg style="width:20px;height:20px" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M13 13H11V7H13M11 15H13V17H11M15.73 3H8.27L3 8.27V15.73L8.27 21H15.73L21 15.73V8.27L15.73 3Z"
                  />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">
                  LocatorJS is not active on this page.
                </h3>
                <div class="mt-2 text-sm text-red-700">
                  <ul role="list" class="pl-5 space-y-1 list-disc">
                    {message()
                      .split('\n')
                      .map((m) => (
                        <li>{m}</li>
                      ))}
                  </ul>
                </div>
                <p class="mt-2 text-red-800 underline">
                  <a
                    target="_blank"
                    href="https://github.com/infi-pc/locatorjs/blob/master/apps/extension/README.md#troubleshooting"
                  >
                    How to solve it?
                  </a>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <label class="text-lg font-medium text-gray-900 mb-4">
              Controls:
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
