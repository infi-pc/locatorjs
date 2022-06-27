"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = nonNullable;

function nonNullable(value) {
  return value !== null && value !== undefined;
}