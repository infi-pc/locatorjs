const browserObj: typeof chrome =
  typeof browser === 'undefined' ? chrome : browser;

export default browserObj;
