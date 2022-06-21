"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fiberToSimple = fiberToSimple;

var _getBoundingRect = require("./getBoundingRect");

var _getComposedBoundingBox = require("./getComposedBoundingBox");

var _getUsableName = require("./getUsableName");

var _getAllFiberChildren = require("./getAllFiberChildren");

function fiberToSimple(fiber) {
  var _fiber$stateNode;

  const children = (0, _getAllFiberChildren.getAllFiberChildren)(fiber);
  const simpleChildren = children.map(child => {
    return fiberToSimple(child);
  });
  const element = fiber.stateNode instanceof Element || fiber.stateNode instanceof Text ? fiber.stateNode : (_fiber$stateNode = fiber.stateNode) === null || _fiber$stateNode === void 0 ? void 0 : _fiber$stateNode.containerInfo;

  if (element) {
    const box = (0, _getBoundingRect.getBoundingRect)(element);
    return {
      type: "element",
      element: element,
      fiber: fiber,
      name: (0, _getUsableName.getUsableName)(fiber),
      box: box || (0, _getComposedBoundingBox.getComposedBoundingBox)(simpleChildren),
      children: simpleChildren
    };
  } else {
    return {
      type: "component",
      fiber: fiber,
      name: (0, _getUsableName.getUsableName)(fiber),
      box: (0, _getComposedBoundingBox.getComposedBoundingBox)(simpleChildren),
      children: simpleChildren
    };
  }
}