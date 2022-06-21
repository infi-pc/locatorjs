"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.gatherFiberRoots = gatherFiberRoots;

var _findFiberByHtmlElement = require("./findFiberByHtmlElement");

function gatherFiberRoots(parentNode, mutable_foundFibers) {
  const nodes = parentNode.childNodes;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    if (node instanceof HTMLElement) {
      var _reactRootContainer, _reactRootContainer$_, _reactRootContainer2;

      const fiber = ((_reactRootContainer = node._reactRootContainer) === null || _reactRootContainer === void 0 ? void 0 : (_reactRootContainer$_ = _reactRootContainer._internalRoot) === null || _reactRootContainer$_ === void 0 ? void 0 : _reactRootContainer$_.current) || ((_reactRootContainer2 = node._reactRootContainer) === null || _reactRootContainer2 === void 0 ? void 0 : _reactRootContainer2.current);

      if (fiber) {
        mutable_foundFibers.push(fiber);
      } else {
        const rootFiber = (0, _findFiberByHtmlElement.findFiberByHtmlElement)(node, false);

        if (rootFiber) {
          mutable_foundFibers.push(rootFiber);
        } else {
          gatherFiberRoots(node, mutable_foundFibers);
        }
      }
    }
  }
}