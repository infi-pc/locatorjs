"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.evalTemplate = evalTemplate;

function evalTemplate(str, params) {
  const names = Object.keys(params);
  const vals = Object.values(params); // @ts-ignore

  return new Function(...names, `return \`${str}\`;`)(...vals);
}