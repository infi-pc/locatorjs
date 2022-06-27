"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.deduplicateLabels = deduplicateLabels;

var _nonNullable = _interopRequireDefault(require("./nonNullable"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function deduplicateLabels(labels) {
  const labelsIds = {};
  return labels.map(label => {
    const id = JSON.stringify(label);

    if (labelsIds[id]) {
      return null;
    }

    labelsIds[id] = true;
    return label;
  }).filter(_nonNullable.default);
}