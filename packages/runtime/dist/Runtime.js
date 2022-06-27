"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.initRender = initRender;

var _web = require("solid-js/web");

var _solidJs = require("solid-js");

var _consts = require("./consts");

var _fiberToSimple = require("./fiberToSimple");

var _gatherFiberRoots = require("./adapters/react/gatherFiberRoots");

var _reactDevToolsAdapter = require("./adapters/reactDevToolsAdapter");

var _isCombinationModifiersPressed = require("./isCombinationModifiersPressed");

var _Outline = require("./Outline");

var _RenderNode = require("./RenderNode");

var _searchDevtoolsRenderersForClosestTarget = require("./searchDevtoolsRenderersForClosestTarget");

var _trackClickStats = require("./trackClickStats");

const _tmpl$ = /*#__PURE__*/(0, _web.template)(`<div id="locator-solid-overlay"></div>`, 2),
      _tmpl$2 = /*#__PURE__*/(0, _web.template)(`<div>LocatorJS</div>`, 2);

function Runtime() {
  // console.log("RUNTIME");
  const [solidMode, setSolidMode] = (0, _solidJs.createSignal)(null);
  const [holdingModKey, setHoldingModKey] = (0, _solidJs.createSignal)(false); // TODO save the real closest element, not the one with fiber

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
    if (!(0, _isCombinationModifiersPressed.isCombinationModifiersPressed)(e)) {
      return;
    }

    setHoldingModKey(true);
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

  function clickListener(e) {
    if (!(0, _isCombinationModifiersPressed.isCombinationModifiersPressed)(e)) {
      return;
    }

    const target = e.target;

    if (target && target instanceof HTMLElement) {
      const labels = (0, _reactDevToolsAdapter.getElementInfo)(target);
      const firstLabel = labels[0];

      if (firstLabel) {
        e.preventDefault();
        e.stopPropagation();
        (0, _trackClickStats.trackClickStats)();
        window.open(firstLabel.link, _consts.HREF_TARGET);
      }
    }
  }

  document.addEventListener("mouseover", mouseOverListener, {
    capture: true
  });
  document.addEventListener("keydown", keyDownListener);
  document.addEventListener("keyup", keyUpListener);
  document.addEventListener("click", clickListener, {
    capture: true
  });
  (0, _solidJs.onCleanup)(() => {
    document.removeEventListener("keyup", keyUpListener);
    document.removeEventListener("keydown", keyDownListener);
    document.removeEventListener("mouseover", mouseOverListener, {
      capture: true
    });
    document.removeEventListener("click", clickListener, {
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
    const _c$3 = (0, _web.memo)(() => !!(holdingModKey() && currentElement() && (0, _reactDevToolsAdapter.getElementInfo)(currentElement())), true);

    return () => _c$3() ? (0, _web.createComponent)(_Outline.Outline, {
      get element() {
        return (0, _reactDevToolsAdapter.getElementInfo)(currentElement());
      }

    }) : null;
  })())];
}

function initRender(solidLayer) {
  (0, _web.render)(() => (0, _web.createComponent)(Runtime, {}), solidLayer);
}

(0, _web.delegateEvents)(["click"]);