"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findFiberByHtmlElement = findFiberByHtmlElement;

var _findDebugSource2 = require("./findDebugSource");

function findFiberByHtmlElement(target, shouldHaveDebugSource) {
  var _window$__REACT_DEVTO;

  const renderers = (_window$__REACT_DEVTO = window.__REACT_DEVTOOLS_GLOBAL_HOOK__) === null || _window$__REACT_DEVTO === void 0 ? void 0 : _window$__REACT_DEVTO.renderers; // console.log("RENDERERS: ", renderers);

  const renderersValues = renderers === null || renderers === void 0 ? void 0 : renderers.values();

  if (renderersValues) {
    for (const renderer of Array.from(renderersValues)) {
      if (renderer.findFiberByHostInstance) {
        const found = renderer.findFiberByHostInstance(target);

        if (found) {
          if (shouldHaveDebugSource) {
            var _findDebugSource;

            return ((_findDebugSource = (0, _findDebugSource2.findDebugSource)(found)) === null || _findDebugSource === void 0 ? void 0 : _findDebugSource.fiber) || null;
          } else {
            return found;
          }
        }
      }
    }
  }

  return null;
}