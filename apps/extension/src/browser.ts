// @ts-ignore
let browserObj: typeof chrome = browser;

// @ts-ignore
if (typeof browser === 'undefined') {
  browserObj = chrome;
}

export default browserObj;
