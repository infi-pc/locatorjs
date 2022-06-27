"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getFiberBoundingBox = getFiberBoundingBox;

function getFiberBoundingBox(fiber) {
  if (fiber.stateNode && fiber.stateNode.getBoundingClientRect) {
    return fiber.stateNode.getBoundingClientRect();
  }

  return null;
}