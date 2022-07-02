"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getIdsOnPathToRoot = getIdsOnPathToRoot;

var _findFiberByHtmlElement = require("./adapters/react/findFiberByHtmlElement");

var _makeFiberId = require("./adapters/react/makeFiberId");

function getIdsOnPathToRoot(element) {
  const fiber = (0, _findFiberByHtmlElement.findFiberByHtmlElement)(element, false);

  if (!fiber) {
    return {};
  }

  let res = {};
  let parent = fiber === null || fiber === void 0 ? void 0 : fiber._debugOwner;

  while (parent) {
    var _parent;

    res[(0, _makeFiberId.makeFiberId)(parent)] = true;
    parent = (_parent = parent) === null || _parent === void 0 ? void 0 : _parent._debugOwner;
  }

  return res;
}