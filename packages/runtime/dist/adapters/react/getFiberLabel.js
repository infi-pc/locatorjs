"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getFiberLabel = getFiberLabel;

var _buidLink = require("../../buidLink");

var _getUsableName = require("../../getUsableName");

function getFiberLabel(fiber, source) {
  const name = (0, _getUsableName.getUsableName)(fiber);
  const link = source ? (0, _buidLink.buidLink)(source.fileName, "", {
    start: {
      column: source.columnNumber || 0,
      line: source.lineNumber || 0
    },
    end: {
      column: source.columnNumber || 0,
      line: source.lineNumber || 0
    }
  }) : null;
  const label = {
    label: name,
    link
  };
  return label;
}