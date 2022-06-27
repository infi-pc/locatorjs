"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getElementInfo = getElementInfo;

var _nonNullable = _interopRequireDefault(require("../nonNullable"));

var _runtimeStore = require("../runtimeStore");

var _deduplicateLabels = require("../deduplicateLabels");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getElementInfo(found) {
  // Instead of labels, return this element, parent elements leading to closest component, its component labels, all wrapping components labels.
  let labels = [];

  if (found.dataset && (found.dataset.locatorjsId || found.dataset.locatorjsStyled)) {
    labels = [found.dataset.locatorjsId ? (0, _runtimeStore.getDataForDataId)(found.dataset.locatorjsId) : null, found.dataset.locatorjsStyled ? (0, _runtimeStore.getDataForDataId)(found.dataset.locatorjsStyled) : null].filter(_nonNullable.default);
  }

  return (0, _deduplicateLabels.deduplicateLabels)(labels);
}