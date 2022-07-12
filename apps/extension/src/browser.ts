/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
let browserObj: typeof chrome;

// @ts-ignore
if (typeof browser === 'undefined') {
  browserObj = chrome;
} else {
  // @ts-ignore
  browserObj = browser;
}

export default browserObj;
