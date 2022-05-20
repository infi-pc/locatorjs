// const code = require('!raw-loader!./generated/client.bundle.js');

console.log('Content script loaded');

const target = localStorage.getItem('target');
console.log('target', target);

chrome.storage.sync.get(['target'], function (result) {
  if (typeof result?.target === 'string') {
    document.documentElement.dataset.locatorTarget = result.target;
  }
});

chrome.storage.onChanged.addListener(function (changes, namespace) {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    console.log('updated storage', key, { oldValue, newValue });
    if (key === 'target') {
      document.documentElement.dataset.locatorTarget = newValue;
    }
  }
});

// TODO get data from

function injectScript() {
  const script = document.createElement('script');
  // script.textContent = code.default;
  script.src = 'chrome-extension://' + chrome.runtime.id + '/hook.bundle.js';

  document.documentElement.dataset.locatorClientUrl =
    'chrome-extension://' + chrome.runtime.id + '/client.bundle.js';

  // This script runs before the <head> element is created,
  // so we add the script to <html> instead.
  if (document.documentElement) {
    document.documentElement.appendChild(script);
    if (script.parentNode) {
      script.parentNode.removeChild(script);
      // delete document.documentElement.dataset.locatorClientUrl;
    }
  }
}

// Inject a __REACT_DEVTOOLS_GLOBAL_HOOK__ global for React to interact with.
// Only do this for HTML documents though, to avoid e.g. breaking syntax highlighting for XML docs.
// We need to inject this code because content scripts (ie injectGlobalHook.js) don't have access
// to the webpage's window, so in order to access front end settings
// and communicate with React, we must inject this code into the webpage
switch (document.contentType) {
  case 'text/html':
  case 'application/xhtml+xml': {
    injectScript();
    break;
  }
}

console.log('Content script loaded, adding listener');
chrome.runtime.onMessage.addListener((msg, sender, response) => {
  // First, validate the message's structure.
  console.log('receiving request');
  if (msg.from === 'popup' && msg.subject === 'statusMessage') {
    console.log('sending status');
    response(document.head.dataset.locatorMessage);
  }
});
