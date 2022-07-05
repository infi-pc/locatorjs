"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.goTo = goTo;
exports.goToSource = goToSource;

var _buidLink = require("./buidLink");

var _consts = require("./consts");

function goTo(link) {
  window.open(link, _consts.HREF_TARGET);
}

function goToSource(source) {
  return goTo((0, _buidLink.buildLinkFromSource)(source));
}