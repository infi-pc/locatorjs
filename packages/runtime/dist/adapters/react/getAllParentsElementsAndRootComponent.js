"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getAllParentsElementsAndRootComponent = getAllParentsElementsAndRootComponent;

var _getUsableName = require("../../getUsableName");

var _mergeRects = require("../../mergeRects");

var _getFiberComponentBoundingBox = require("./getFiberComponentBoundingBox");

function getAllParentsElementsAndRootComponent(fiber) {
  const parentElements = [];
  const deepestElement = fiber.stateNode;

  if (!deepestElement || !(deepestElement instanceof HTMLElement)) {
    throw new Error("This functions works only for Fibres with HTMLElement stateNode");
  }

  let componentBox = deepestElement.getBoundingClientRect();
  let currentFiber = fiber;

  while (currentFiber._debugOwner || currentFiber.return) {
    currentFiber = currentFiber._debugOwner || currentFiber.return;
    const currentElement = currentFiber.stateNode;

    if (!currentElement || !(currentElement instanceof HTMLElement)) {
      return {
        component: currentFiber,
        parentElements,
        componentBox: (0, _getFiberComponentBoundingBox.getFiberComponentBoundingBox)(currentFiber) || componentBox
      };
    }

    const usableName = (0, _getUsableName.getUsableName)(currentFiber);
    componentBox = (0, _mergeRects.mergeRects)(componentBox, currentElement.getBoundingClientRect());
    parentElements.push({
      box: currentElement.getBoundingClientRect(),
      label: usableName,
      link: "TODO"
    });
  }

  throw new Error("Could not find root component");
}