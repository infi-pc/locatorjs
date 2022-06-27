"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getAllWrappingParents = getAllWrappingParents;

var _getAllFiberChildren = require("../../getAllFiberChildren");

function getAllWrappingParents(fiber) {
  const parents = [fiber];
  let currentFiber = fiber;

  while (currentFiber.return) {
    currentFiber = currentFiber.return;

    if (currentFiber.stateNode && currentFiber.stateNode instanceof HTMLElement) {
      return parents;
    } // if there is multiple children, it means the parent is not just wrapping this one


    const children = (0, _getAllFiberChildren.getAllFiberChildren)(currentFiber);

    if (children.length > 1) {
      return parents;
    }

    parents.push(currentFiber);
  }

  return parents;
}