"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getFiberComponentBoundingBox = getFiberComponentBoundingBox;

var _getFiberBoundingBox = require("./react/getFiberBoundingBox");

var _getAllFiberChildren = require("../getAllFiberChildren");

var _mergeRects = require("../mergeRects");

function getFiberComponentBoundingBox(fiber) {
  const children = (0, _getAllFiberChildren.getAllFiberChildren)(fiber);
  let composedRect;
  children.forEach(child => {
    const box = (0, _getFiberBoundingBox.getFiberBoundingBox)(child);

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