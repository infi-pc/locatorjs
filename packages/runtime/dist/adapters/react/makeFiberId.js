"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeFiberId = makeFiberId;
let globalIdCounter = 0;
const globalIdMap = new WeakMap();

function makeFiberId(fiber) {
  const found = globalIdMap.get(fiber);

  if (found) {
    return found;
  } else {
    globalIdCounter++;
    const id = `map:${globalIdCounter}`;
    globalIdMap.set(fiber, id);
    return id;
  }
}