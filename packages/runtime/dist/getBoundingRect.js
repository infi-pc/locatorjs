"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getBoundingRect = getBoundingRect;

function getBoundingRect(node) {
  if (node instanceof Element) {
    return node.getBoundingClientRect();
  } else if (node instanceof Text) {
    const range = document.createRange();
    range.selectNodeContents(node);
    return range.getBoundingClientRect();
  } else {
    return null;
  }
}