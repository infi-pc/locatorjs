import { installReactDevtoolsHook } from './devtoolsHook/installReactDevtoolsHook';

installReactDevtoolsHook();

const locatorClientUrl = document.documentElement.dataset.locatorClientUrl;
window.setTimeout(() => {
  if (!locatorClientUrl) {
    throw new Error('Locator client url not found');
  }
  console.log('Injecting!!!! ', locatorClientUrl);
  const script = document.createElement('script');
  script.src = locatorClientUrl;
  if (document.head) {
    document.head.appendChild(script);
    if (script.parentNode) {
      script.parentNode.removeChild(script);
      // delete document.documentElement.dataset.locatorClientUrl;
    }
  }
}, 1000);
