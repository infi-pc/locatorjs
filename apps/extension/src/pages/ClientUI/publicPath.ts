import { assetBaseUrlFromClientUrl } from './assetBaseUrl';

declare let __webpack_public_path__: string;

const currentScript = document.currentScript;
const clientUrl =
  currentScript instanceof HTMLScriptElement ? currentScript.src : undefined;
const assetBaseUrl = assetBaseUrlFromClientUrl(clientUrl);

if (assetBaseUrl) {
  // Webpack reads this assignment while bootstrapping asset modules.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  __webpack_public_path__ = assetBaseUrl;
}
