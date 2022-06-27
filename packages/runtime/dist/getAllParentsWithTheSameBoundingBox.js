"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getAllWrappingParents = getAllWrappingParents;

var _getFiberBoundingBox = require("./adapters/react/getFiberBoundingBox");

function getAllWrappingParents(fiber) {
  const parents = [fiber];
  let currentFiber = fiber;

  while (currentFiber.return) {
    currentFiber = currentFiber.return;
    const fiberBox = (0, _getFiberBoundingBox.getFiberBoundingBox)(fiber);
    const currentFiberBox = (0, _getFiberBoundingBox.getFiberBoundingBox)(currentFiber);

    if (fiberBox && currentFiberBox) {
      if (currentFiberBox.x === fiberBox.x && currentFiberBox.y === fiberBox.y && currentFiberBox.width === fiberBox.width && currentFiberBox.height === fiberBox.height) {
        parents.push(currentFiber);
      } else {
        break;
      }
    }
  }

  return parents;
}