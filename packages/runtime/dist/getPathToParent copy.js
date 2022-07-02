"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getPathToParent = getPathToParent;

var _findFiberByHtmlElement = require("./adapters/react/findFiberByHtmlElement");

var _fiberToSimple = require("./adapters/react/fiberToSimple");

function getPathToParent(element) {
  const fiber = (0, _findFiberByHtmlElement.findFiberByHtmlElement)(element, false);

  if (!fiber) {
    return;
  }

  let res = (0, _fiberToSimple.fiberToSimple)(fiber);
  let parent = fiber === null || fiber === void 0 ? void 0 : fiber._debugOwner;

  while (parent) {
    var _parent;

    res = (0, _fiberToSimple.fiberToSimple)(parent, [res]);
    parent = (_parent = parent) === null || _parent === void 0 ? void 0 : _parent._debugOwner;
  }

  return res;
}