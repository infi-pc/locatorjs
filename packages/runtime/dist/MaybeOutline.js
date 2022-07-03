"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MaybeOutline = MaybeOutline;

var _web = require("solid-js/web");

var _solidJs = require("solid-js");

var _reactAdapter = require("./adapters/react/reactAdapter");

var _Outline = require("./Outline");

function MaybeOutline(props) {
  const elInfo = (0, _solidJs.createMemo)(() => (0, _reactAdapter.getElementInfo)(props.currentElement));
  return (0, _web.memo)((() => {
    const _c$ = (0, _web.memo)(() => !!elInfo(), true);

    return () => _c$() ? (0, _web.createComponent)(_Outline.Outline, {
      get element() {
        return elInfo();
      },

      get showTreeFromElement() {
        return props.showTreeFromElement;
      }

    }) : null;
  })());
}