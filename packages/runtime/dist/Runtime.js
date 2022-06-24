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

var _Outline = require("./Outline");

var _RenderNode = require("./RenderNode");

var _searchDevtoolsRenderersForClosestTarget = require("./searchDevtoolsRenderersForClosestTarget");

const _tmpl$ = /*#__PURE__*/(0, _web.template)(`<div id="locator-solid-overlay"></div>`, 2),
      _tmpl$2 = /*#__PURE__*/(0, _web.template)(`<div>LocatorJS</div>`, 2);

function Runtime() {
  const [solidMode, setSolidMode] = (0, _solidJs.createSignal)(null);
  const [holdingModKey, setHoldingModKey] = (0, _solidJs.createSignal)(false);
  const [currentElement, setCurrentElement] = (0, _solidJs.createSignal)(null);
  (0, _solidJs.createEffect)(() => {
    console.log({
      holding: holdingModKey(),
      currentElement: currentElement()
    });
  });

  function keyUpListener(e) {
    if (e.code === "KeyO" && (0, _isCombinationModifiersPressed.isCombinationModifiersPressed)(e)) {
      setSolidMode(solidMode() === "xray" ? null : "xray");
    }

    setHoldingModKey((0, _isCombinationModifiersPressed.isCombinationModifiersPressed)(e));
  }

  function keyDownListener(e) {
    setHoldingModKey((0, _isCombinationModifiersPressed.isCombinationModifiersPressed)(e));
  }

  function mouseOverListener(e) {
    const target = e.target;

    if (target && target instanceof HTMLElement) {
      if (target.className == "locatorjs-label" || target.id == "locatorjs-labels-section" || target.id == "locatorjs-solid-layer") {
        return;
      }

      const found = target.closest("[data-locatorjs-id]") || (0, _searchDevtoolsRenderersForClosestTarget.searchDevtoolsRenderersForClosestTarget)(target);

      if (found && found instanceof HTMLElement) {
        setCurrentElement(found);
      }
    }
  }

  document.addEventListener("mouseover", mouseOverListener, {
    capture: true
  });
  document.addEventListener("keydown", keyDownListener);
  document.addEventListener("keyup", keyUpListener);
  (0, _solidJs.onCleanup)(() => {
    document.removeEventListener("keyup", keyUpListener);
    document.removeEventListener("keydown", keyDownListener);
    document.removeEventListener("mouseover", mouseOverListener, {
      capture: true
    });
  });

  const getAllNodes = () => {
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

  return [(0, _web.memo)((() => {
    const _c$ = (0, _web.memo)(() => solidMode() === "xray", true);

    return () => _c$() ? (() => {
      const _el$ = _tmpl$.cloneNode(true);

      _el$.$$click = e => {
        setSolidMode(null);
      };

      (0, _web.insert)(_el$, (0, _web.createComponent)(_solidJs.For, {
        get each() {
          return getAllNodes();
        },

        children: (node, i) => (0, _web.createComponent)(_RenderNode.RenderXrayNode, {
          node: node,
          parentIsHovered: false
        })
      }));
      return _el$;
    })() : null;
  })()), (0, _web.memo)((() => {
    const _c$2 = (0, _web.memo)(() => !!holdingModKey(), true);

    return () => _c$2() ? (() => {
      const _el$2 = _tmpl$2.cloneNode(true);

      _el$2.style.setProperty("position", "fixed");

      _el$2.style.setProperty("bottom", "0");

      _el$2.style.setProperty("left", "0");

      _el$2.style.setProperty("background", "rgba(255,255,255,0.5)");

      return _el$2;
    })() : null;
  })()), (0, _web.memo)((() => {
    const _c$3 = (0, _web.memo)(() => !!(holdingModKey() && currentElement()), true);

    return () => _c$3() ? (0, _web.createComponent)(_Outline.Outline, {
      get element() {
        return currentElement();
      }

    }) : null;
  })())];
}

function initRender(solidLayer) {
  (0, _web.render)(() => (0, _web.createComponent)(Runtime, {}), solidLayer);
}

(0, _web.delegateEvents)(["click"]);