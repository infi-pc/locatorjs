"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findNames = findNames;

var _getUsableName = require("./getUsableName");

function findNames(fiber) {
  // if (fiber._debugOwner?.elementType?.styledComponentId) {
  //   // This is special case for styled-components, we need to show one level up
  //   return {
  //     name: getUsableName(fiber._debugOwner),
  //     wrappingComponent: getUsableName(fiber._debugOwner?._debugOwner),
  //   };
  // } else {
  return {
    name: (0, _getUsableName.getUsableName)(fiber),
    wrappingComponent: (0, _getUsableName.getUsableName)(fiber._debugOwner)
  }; // }
}