"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getElementInfo = getElementInfo;

var _findDebugSource2 = require("./findDebugSource");

var _findFiberByHtmlElement = require("./findFiberByHtmlElement");

var _getFiberLabel = require("./getFiberLabel");

var _getAllWrappingParents = require("./getAllWrappingParents");

var _deduplicateLabels = require("../../deduplicateLabels");

var _getFiberBoundingBox = require("./getFiberBoundingBox");

var _getUsableName = require("../../getUsableName");

var _mergeRects = require("../../mergeRects");

var _getFiberComponentBoundingBox = require("./getFiberComponentBoundingBox");

function getElementInfo(found) {
  // Instead of labels, return this element, parent elements leading to closest component, its component labels, all wrapping components labels.
  let labels = [];
  const fiber = (0, _findFiberByHtmlElement.findFiberByHtmlElement)(found, false);

  if (fiber) {
    var _findDebugSource;

    const {
      component,
      componentBox,
      parentElements
    } = getAllParentsElementsAndRootComponent(fiber);
    const allPotentialComponentFibers = (0, _getAllWrappingParents.getAllWrappingParents)(component); // This handles a common case when the component root is basically the comopnent itself, so I want to go to usage of the component

    if (fiber.return && fiber.return === fiber._debugOwner) {
      allPotentialComponentFibers.push(fiber.return);
    }

    allPotentialComponentFibers.forEach(fiber => {
      const fiberWithSource = (0, _findDebugSource2.findDebugSource)(fiber);

      if (fiberWithSource) {
        const label = (0, _getFiberLabel.getFiberLabel)(fiberWithSource.fiber, fiberWithSource.source);
        labels.push(label);
      }
    });
    const thisLabel = (0, _getFiberLabel.getFiberLabel)(fiber, (_findDebugSource = (0, _findDebugSource2.findDebugSource)(fiber)) === null || _findDebugSource === void 0 ? void 0 : _findDebugSource.source);
    return {
      thisElement: {
        box: (0, _getFiberBoundingBox.getFiberBoundingBox)(fiber) || found.getBoundingClientRect(),
        ...thisLabel
      },
      parentElements: parentElements,
      componentBox,
      componentsLabels: (0, _deduplicateLabels.deduplicateLabels)(labels)
    };
  }

  return null;
}

function getAllParentsElementsAndRootComponent(fiber) {
  console.log("getAllParentsElementsAndRootComponent", fiber);
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
      console.log("When fragment, we should go up", currentFiber);
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