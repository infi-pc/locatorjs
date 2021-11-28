"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
const unstringSnapshotSerializer = {
  test: val => typeof val === 'string',
  print: val => val
};
var _default = unstringSnapshotSerializer;
exports.default = _default;