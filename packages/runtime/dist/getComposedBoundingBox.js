"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getComposedBoundingBox = getComposedBoundingBox;

var _mergeRects = require("./mergeRects");

function getComposedBoundingBox(children) {
  let composedRect = null;
  children.forEach(child => {
    const box = child.box;

    if (!box) {
      return;
    }

    if (box.width <= 0 || box.height <= 0) {
      // ignore zero-sized rects
      return;
    }

    if (composedRect) {
      composedRect = (0, _mergeRects.mergeRects)(composedRect, box);
    } else {
      composedRect = box;
    }
  });
  return composedRect;
}