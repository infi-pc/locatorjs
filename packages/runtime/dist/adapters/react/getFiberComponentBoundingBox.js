"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getFiberComponentBoundingBox = getFiberComponentBoundingBox;

var _getFiberOwnBoundingBox = require("./getFiberOwnBoundingBox");

var _getAllFiberChildren = require("../../getAllFiberChildren");

var _mergeRects = require("../../mergeRects");

const MAX_LEVEL = 6;

function getFiberComponentBoundingBox(fiber, level = 0) {
  const children = (0, _getAllFiberChildren.getAllFiberChildren)(fiber);
  let composedRect;
  children.forEach(child => {
    let box = (0, _getFiberOwnBoundingBox.getFiberOwnBoundingBox)(child);

    if (!box && level < MAX_LEVEL) {
      box = getFiberComponentBoundingBox(child, level + 1) || null;
    }

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