"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getLabels = getLabels;

var _findDebugSource = require("./findDebugSource");

var _findFiberByHtmlElement = require("./findFiberByHtmlElement");

var _getFiberLabel = require("./getFiberLabel");

var _index = _interopRequireWildcard(require("./index"));

var _getAllParentsWithTheSameBoundingBox = require("./getAllParentsWithTheSameBoundingBox");

var _deduplicateLabels = require("./deduplicateLabels");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function getLabels(found) {
  let labels = [];

  if (found.dataset && (found.dataset.locatorjsId || found.dataset.locatorjsStyled)) {
    labels = [found.dataset.locatorjsId ? (0, _index.getDataForDataId)(found.dataset.locatorjsId) : null, found.dataset.locatorjsStyled ? (0, _index.getDataForDataId)(found.dataset.locatorjsStyled) : null].filter(_index.default);
  }

  if (labels.length === 0) {
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
      });
    }
  }

  return (0, _deduplicateLabels.deduplicateLabels)(labels);
}