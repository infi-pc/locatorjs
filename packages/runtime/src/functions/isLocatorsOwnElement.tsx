export function isLocatorsOwnElement(element: HTMLElement) {
  if (
    element.className == "locatorjs-label" ||
    element.id == "locatorjs-labels-section" ||
    element.id == "locatorjs-layer" ||
    element.id == "locatorjs-wrapper" ||
    element.matches("#locatorjs-wrapper *")
  ) {
    return true;
  }

  // Locator's own UI lives inside a shadow root, so an element resolved through
  // the shadow boundary has no `#locatorjs-wrapper` ancestor in its own tree.
  // Walk out through every host until we hit the document.
  let root = element.getRootNode();
  while (root instanceof ShadowRoot) {
    const host = root.host as HTMLElement;
    if (host.id === "locatorjs-wrapper") {
      return true;
    }
    root = host.getRootNode();
  }

  return false;
}
