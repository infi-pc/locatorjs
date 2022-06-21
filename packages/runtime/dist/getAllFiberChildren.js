"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getAllFiberChildren = getAllFiberChildren;

function getAllFiberChildren(fiber) {
  const allChildren = [];
  let child = fiber.child;

  while (child) {
    allChildren.push(child);
    child = child.sibling;
  }

  return allChildren;
}