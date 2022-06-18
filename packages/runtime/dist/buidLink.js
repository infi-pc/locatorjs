"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buidLink = buidLink;

var _index = require("./index");

var _evalTemplate = require("./evalTemplate");

function buidLink(filePath, projectPath, loc) {
  const params = {
    filePath,
    projectPath,
    line: loc.start.line,
    column: loc.start.column + 1
  };
  return (0, _evalTemplate.evalTemplate)((0, _index.linkTemplateUrl)(), params);
}