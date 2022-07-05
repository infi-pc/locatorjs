"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getFiberOwnBoundingBox = getFiberOwnBoundingBox;

function getFiberOwnBoundingBox(fiber) {
  if (fiber.stateNode && fiber.stateNode.getBoundingClientRect) {
    return fiber.stateNode.getBoundingClientRect();
  }

  return null;
}