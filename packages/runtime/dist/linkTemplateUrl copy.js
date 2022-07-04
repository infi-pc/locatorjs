"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.linkTemplate = exports.getLinkTypeOrTemplate = void 0;
exports.linkTemplateUrl = linkTemplateUrl;

var _shared = require("@locator/shared");

let getLinkTypeOrTemplate = () => document.documentElement.dataset.locatorTarget || "vscode";

exports.getLinkTypeOrTemplate = getLinkTypeOrTemplate;

let linkTemplate = () => _shared.allTargets[getLinkTypeOrTemplate()];

exports.linkTemplate = linkTemplate;

function linkTemplateUrl() {
  const l = linkTemplate();
  return l ? l.url : getLinkTypeOrTemplate();
}