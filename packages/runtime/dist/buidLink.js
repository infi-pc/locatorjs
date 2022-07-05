"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buidLink = buidLink;
exports.buildLinkFromSource = buildLinkFromSource;

var _linkTemplateUrl = require("./linkTemplateUrl");

var _evalTemplate = require("./evalTemplate");

function buidLink(filePath, projectPath, loc) {
  const params = {
    filePath,
    projectPath,
    line: loc.start.line,
    column: loc.start.column + 1
  };
  return (0, _evalTemplate.evalTemplate)((0, _linkTemplateUrl.linkTemplateUrl)(), params);
}

function buildLinkFromSource(source) {
  return buidLink(source.fileName, "", {
    start: {
      column: source.columnNumber || 0,
      line: source.lineNumber || 0
    },
    end: {
      column: source.columnNumber || 0,
      line: source.lineNumber || 0
    }
  });
}