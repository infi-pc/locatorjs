"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isStyledElement = isStyledElement;

function isStyledElement(fiber) {
  var _fiber$_debugOwner, _fiber$_debugOwner$el;

  return !!((_fiber$_debugOwner = fiber._debugOwner) !== null && _fiber$_debugOwner !== void 0 && (_fiber$_debugOwner$el = _fiber$_debugOwner.elementType) !== null && _fiber$_debugOwner$el !== void 0 && _fiber$_debugOwner$el.styledComponentId);
}