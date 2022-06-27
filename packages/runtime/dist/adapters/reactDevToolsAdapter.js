"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getElementInfo = getElementInfo;

var _findDebugSource = require("../findDebugSource");

var _findFiberByHtmlElement = require("./react/findFiberByHtmlElement");

var _getFiberLabel = require("../getFiberLabel");

var _getAllParentsWithTheSameBoundingBox = require("../getAllParentsWithTheSameBoundingBox");

var _deduplicateLabels = require("../deduplicateLabels");

var _getFiberBoundingBox = require("./react/getFiberBoundingBox");

function getElementInfo(found) {
  // Instead of labels, return this element, parent elements leading to closest component, its component labels, all wrapping components labels.
  let labels = [];
  const fiber = (0, _findFiberByHtmlElement.findFiberByHtmlElement)(found, false);

  if (fiber) {
    const allPotentialFibers = (0, _getAllParentsWithTheSameBoundingBox.getAllParentsWithTheSameBoundingBox)(fiber); // This handles a common case when the component root is basically the comopnent itself, so I want to go to usage of the component

    if (fiber.return && fiber.return === fiber._debugOwner) {
      allPotentialFibers.push(fiber.return);
    }

    allPotentialFibers.forEach(fiber => {
      const fiberWithSource = (0, _findDebugSource.findDebugSource)(fiber);

      if (fiberWithSource) {
        const label = (0, _getFiberLabel.getFiberLabel)(fiberWithSource.fiber, fiberWithSource.source);
        labels.push(label);
      }
    }); // TODO parentElements
    // TODO parentComponents

    const thisLabel = (0, _getFiberLabel.getFiberLabel)(fiber);
    return {
      thisElement: {
        box: (0, _getFiberBoundingBox.getFiberBoundingBox)(fiber) || found.getBoundingClientRect(),
        ...thisLabel
      },
      parentElements: [],
      componentBox: (0, _getFiberBoundingBox.getFiberBoundingBox)(fiber) || found.getBoundingClientRect(),
      componentsLabels: (0, _deduplicateLabels.deduplicateLabels)(labels)
    };
  }

  return null;
}