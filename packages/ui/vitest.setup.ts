// jsdom implements neither, and the keyboard-navigation code in TreePanel and
// ParentsMenu calls them while moving focus.
Object.defineProperty(HTMLElement.prototype, "scrollTo", {
  configurable: true,
  value: () => undefined,
});

Object.defineProperty(Element.prototype, "scrollIntoView", {
  configurable: true,
  value: () => undefined,
});
