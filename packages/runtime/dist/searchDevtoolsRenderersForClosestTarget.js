"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.searchDevtoolsRenderersForClosestTarget = searchDevtoolsRenderersForClosestTarget;

var _findFiberByHtmlElement = require("./findFiberByHtmlElement");

function searchDevtoolsRenderersForClosestTarget(target) {
  let closest = target;

  while (closest) {
    if ((0, _findFiberByHtmlElement.findFiberByHtmlElement)(closest, false)) {
      return closest;
    }

    closest = closest.parentElement;
  }

  return null;
}