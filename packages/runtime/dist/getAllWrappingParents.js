"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getAllWrappingParents = getAllWrappingParents;

function getAllWrappingParents(fiber) {
  const parents = [fiber];
  let currentFiber = fiber;

  while (currentFiber.return) {
    currentFiber = currentFiber.return;

    if (currentFiber.stateNode && currentFiber.stateNode instanceof HTMLElement) {
      return parents;
    }

    parents.push(currentFiber);
  }

  return parents;
}