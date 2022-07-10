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

var _getFiberOwnBoundingBox = require("./getFiberOwnBoundingBox");

var _getAllParentsElementsAndRootComponent = require("./getAllParentsElementsAndRootComponent");

var _isStyled = require("./isStyled");

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
    // TODO: whaat? why? currently I see that it adds the original styled components which is not necessary.
    // if (fiber.return && fiber.return === fiber._debugOwner) {
    //   allPotentialComponentFibers.unshift(fiber.return);
    // }

    allPotentialComponentFibers.forEach(fiber => {
      const fiberWithSource = (0, _findDebugSource2.findDebugSource)(fiber);

      if (fiberWithSource) {
        const label = (0, _getFiberLabel.getFiberLabel)(fiberWithSource.fiber, fiberWithSource.source);
        labels.push(label);
      }
    });
    const thisLabel = (0, _getFiberLabel.getFiberLabel)(fiber, (_findDebugSource = (0, _findDebugSource2.findDebugSource)(fiber)) === null || _findDebugSource === void 0 ? void 0 : _findDebugSource.source);

    if ((0, _isStyled.isStyledElement)(fiber)) {
      thisLabel.label = `${thisLabel.label} (styled)`;
    }

    return {
      thisElement: {
        box: (0, _getFiberOwnBoundingBox.getFiberOwnBoundingBox)(fiber) || found.getBoundingClientRect(),
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