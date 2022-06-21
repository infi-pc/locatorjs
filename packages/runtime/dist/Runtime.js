"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.initRender = initRender;

var _web = require("solid-js/web");

var _solidJs = require("solid-js");

var _fiberToSimple = require("./fiberToSimple");

var _gatherFiberRoots = require("./gatherFiberRoots");

var _isCombinationModifiersPressed = require("./isCombinationModifiersPressed");

var _RenderNode = require("./RenderNode");

const _tmpl$ = /*#__PURE__*/(0, _web.template)(`<div id="locator-solid-overlay"></div>`, 2);

function Runtime() {
  const [solidMode, setSolidMode] = (0, _solidJs.createSignal)(null);

  function globalKeyUpListener(e) {
    if (e.code === "KeyO" && (0, _isCombinationModifiersPressed.isCombinationModifiersPressed)(e)) {
      setSolidMode(solidMode() === "xray" ? null : "xray");
    }
  }

  document.addEventListener("keyup", globalKeyUpListener);
  (0, _solidJs.onCleanup)(() => {
    document.removeEventListener("keyup", globalKeyUpListener);
  });

  const getFoundNodes = () => {
    if (solidMode() === "xray") {
      const foundFiberRoots = [];
      (0, _gatherFiberRoots.gatherFiberRoots)(document.body, foundFiberRoots);
      console.log({
        foundFiberRoots
      });
      const simpleRoots = foundFiberRoots.map(fiber => {
        return (0, _fiberToSimple.fiberToSimple)(fiber);
      });
      return simpleRoots;
    } else {
      return [];
    }
  };

  return (0, _web.memo)((() => {
    const _c$ = (0, _web.memo)(() => !!solidMode(), true);

    return () => _c$() ? (() => {
      const _el$ = _tmpl$.cloneNode(true);

      _el$.$$click = e => {
        setSolidMode(null);
      };

      (0, _web.insert)(_el$, (0, _web.createComponent)(_solidJs.For, {
        get each() {
          return getFoundNodes();
        },

        children: (node, i) => (0, _web.createComponent)(_RenderNode.RenderXrayNode, {
          node: node,
          parentIsHovered: false
        })
      }));
      return _el$;
    })() : null;
  })());
}

function initRender(solidLayer) {
  (0, _web.render)(() => (0, _web.createComponent)(Runtime, {}), solidLayer);
}

(0, _web.delegateEvents)(["click"]);