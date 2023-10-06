import { getStoredOptions, setStoredOptions } from '@locator/shared';
import browser from '../../browser';

browser.storage.local.get(['target'], function (result) {
  if (typeof result?.target === 'string') {
    document.documentElement.dataset.locatorTarget = result.target;
  }
});

browser.storage.local.get(['enableExperimentalFeatures'], function (result) {
  if (result?.enableExperimentalFeatures === true) {
    document.documentElement.dataset.locatorExperimentalFeatures = 'true';
  }
});

browser.storage.onChanged.addListener(function (changes) {
  for (const [key, { newValue }] of Object.entries(changes)) {
    if (key === 'target') {
      document.documentElement.dataset.locatorTarget = newValue;
    }
  }
});

browser.storage.local.get(['controls'], function (result) {
  if (typeof result?.controls === 'string') {
    document.documentElement.dataset.locatorMouseModifiers = result.controls;
  }
});

browser.storage.onChanged.addListener(function (changes) {
  for (const [key, { newValue }] of Object.entries(changes)) {
    if (key === 'controls') {
      document.documentElement.dataset.locatorMouseModifiers = newValue;
    }
  }
});

function injectScript() {
  const script = document.createElement('script');
  // script.textContent = code.default;
  script.src = browser.runtime.getURL('/hook.bundle.js');

  document.documentElement.dataset.locatorClientUrl =
    browser.runtime.getURL('/client.bundle.js');

  // This script runs before the <head> element is created,
  // so we add the script to <html> instead.
  if (document.documentElement) {
    document.documentElement.appendChild(script);
    if (script.parentNode) {
      script.parentNode.removeChild(script);
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

function getHookStatusMessage() {
  return (
    // we combine the two messages to make it easier to handle in popup
    document.head.dataset.locatorDisabled ||
    document.head.dataset.locatorHookStatusMessage ||
    `loading: waiting for hook`
  );
}

browser.runtime.onMessage.addListener((msg, sender, response) => {
  if (msg.from === 'popup' && msg.subject === 'requestStatusMessage') {
    response(getHookStatusMessage());
  }
});

browser.runtime.onMessage.addListener((msg) => {
  if (msg.from === 'popup' && msg.subject === 'requestEnable') {
    const savedOptions = getStoredOptions();
    const optionsToSave = {
      ...savedOptions,
      disabled: typeof msg.value === 'boolean' ? !msg.value : false,
    };

    setStoredOptions(optionsToSave);

    postMessage({ type: 'LOCATOR_EXTENSION_UPDATED_OPTIONS' }, '*');
  }
});
