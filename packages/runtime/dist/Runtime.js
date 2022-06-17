"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.initRender = initRender;

var _web = require("solid-js/web");

var _solidJs = require("solid-js");

var _isCombinationModifiersPressed = require("./isCombinationModifiersPressed");

const _tmpl$ = /*#__PURE__*/(0, _web.template)(`<div>SOLID RUNTIME!!! mode: </div>`, 2);

console.log({
  template: _web.template
});

function Runtime() {
  const [solidMode, setSolidMode] = (0, _solidJs.createSignal)(null);

  function globalKeyUpListener(e) {
    if (e.code === "KeyO" && (0, _isCombinationModifiersPressed.isCombinationModifiersPressed)(e)) {
      setSolidMode("xray");
    }
  }

  document.addEventListener("keyup", globalKeyUpListener);
  (0, _solidJs.onCleanup)(() => {
    document.removeEventListener("keyup", globalKeyUpListener);
  });
  return (() => {
    const _el$ = _tmpl$.cloneNode(true),
          _el$2 = _el$.firstChild;

    (0, _web.insert)(_el$, solidMode, null);
    return _el$;
  })();
}

function initRender(solidLayer) {
  (0, _web.render)(() => (0, _web.createComponent)(Runtime, {}), solidLayer);
}