export function isExtension() {
  return typeof document !== "undefined"
    ? !!document.documentElement.dataset.locatorClientUrl
    : false;
}
