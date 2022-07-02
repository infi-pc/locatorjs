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

var _getAllParentsElementsAndRootComponent = require("./getAllParentsElementsAndRootComponent");

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
    } = (0, _getAllParentsElementsAndRootComponent.getAllParentsElementsAndRootComponent)(fiber);
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
      htmlElement: found,
      parentElements: parentElements,
      componentBox,
      componentsLabels: (0, _deduplicateLabels.deduplicateLabels)(labels)
    };
  }

  return null;
}