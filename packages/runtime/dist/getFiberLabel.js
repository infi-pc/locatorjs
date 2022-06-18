"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getFiberLabel = getFiberLabel;

var _findNames = require("./findNames");

var _buidLink = require("./buidLink");

function getFiberLabel(fiber, source) {
  const {
    name,
    wrappingComponent
  } = (0, _findNames.findNames)(fiber);
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
    label: (wrappingComponent ? `${wrappingComponent}: ` : "") + name,
    link
  };
  return label;
}