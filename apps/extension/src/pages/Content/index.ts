// const code = require('!raw-loader!./generated/client.bundle.js');

browser.storage.local.get(['target'], function (result) {
  if (typeof result?.target === 'string') {
    document.documentElement.dataset.locatorTarget = result.target;
  }
});

browser.storage.onChanged.addListener(function (changes, namespace) {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    if (key === 'target') {
      document.documentElement.dataset.locatorTarget = newValue;
    }
  }
});

// TODO get data from

function injectScript() {
  const script = document.createElement('script');
  // script.textContent = code.default;
  script.src = browser.extension.getURL('/hook.bundle.js');

  document.documentElement.dataset.locatorClientUrl =
    browser.extension.getURL('/client.bundle.js');

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

browser.runtime.onMessage.addListener((msg, sender, response) => {
  if (msg.from === 'popup' && msg.subject === 'statusMessage') {
    response(
      document.head.dataset.locatorMessage || 'Could not load Hook script.'
    );
  }
});
