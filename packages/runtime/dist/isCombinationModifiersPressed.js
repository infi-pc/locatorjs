"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getMouseModifiers = getMouseModifiers;
exports.isCombinationModifiersPressed = isCombinationModifiersPressed;

function getMouseModifiers() {
  const mouseModifiers = document.documentElement.dataset.locatorMouseModifiers || "alt";
  const mouseModifiersArray = mouseModifiers.split("+");
  const modifiers = {};
  mouseModifiersArray.forEach(modifier => {
    modifiers[modifier] = true;
  }, {});
  return modifiers;
}

function isCombinationModifiersPressed(e) {
  const modifiers = getMouseModifiers();
  return e.altKey == !!modifiers.alt && e.ctrlKey == !!modifiers.ctrl && e.metaKey == !!modifiers.meta && e.shiftKey == !!modifiers.shift;
}