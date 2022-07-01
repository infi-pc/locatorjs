"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.initRender = initRender;

var _web = require("solid-js/web");

var _solidJs = require("solid-js");

var _consts = require("./consts");

var _fiberToSimple = require("./adapters/react/fiberToSimple");

var _gatherFiberRoots = require("./adapters/react/gatherFiberRoots");

var _reactAdapter = require("./adapters/react/reactAdapter");

var _isCombinationModifiersPressed = require("./isCombinationModifiersPressed");

var _Outline = require("./Outline");

var _trackClickStats = require("./trackClickStats");

const _tmpl$ = /*#__PURE__*/(0, _web.template)(`<div id="locator-solid-overlay"></div>`, 2),
      _tmpl$2 = /*#__PURE__*/(0, _web.template)(`<div>LocatorJS</div>`, 2),
      _tmpl$3 = /*#__PURE__*/(0, _web.template)(`<div><div>&lt;<!>></div></div>`, 5),
      _tmpl$4 = /*#__PURE__*/(0, _web.template)(`<div><div><div>:</div> <div></div></div></div>`, 8);

function Runtime(props) {
  const [solidMode, setSolidMode] = (0, _solidJs.createSignal)(null);
  const [holdingModKey, setHoldingModKey] = (0, _solidJs.createSignal)(false);
  const [currentElement, setCurrentElement] = (0, _solidJs.createSignal)(null);
  (0, _solidJs.createEffect)(() => {
    if (holdingModKey() && currentElement()) {
      document.body.classList.add("locatorjs-active-pointer");
    } else {
      document.body.classList.remove("locatorjs-active-pointer");
    }
  });
  (0, _solidJs.createEffect)(() => {
    if (solidMode() === "tree") {
      document.body.classList.add("locatorjs-move-body");
    } else {
      document.body.classList.remove("locatorjs-move-body");
    }
  });

  function keyUpListener(e) {
    if (e.code === "KeyO" && (0, _isCombinationModifiersPressed.isCombinationModifiersPressed)(e)) {
      setSolidMode(solidMode() === "tree" ? null : "tree");
    }

    setHoldingModKey((0, _isCombinationModifiersPressed.isCombinationModifiersPressed)(e));
  }

  function keyDownListener(e) {
    setHoldingModKey((0, _isCombinationModifiersPressed.isCombinationModifiersPressed)(e));
  }

  function mouseOverListener(e) {
    setHoldingModKey((0, _isCombinationModifiersPressed.isCombinationModifiersPressed)(e));
    const target = e.target;

    if (target && target instanceof HTMLElement) {
      if (target.className == "locatorjs-label" || target.id == "locatorjs-labels-section" || target.id == "locatorjs-layer" || target.id == "locatorjs-wrapper") {
        return;
      }

      setCurrentElement(target); // const found =
      //   target.closest("[data-locatorjs-id]") ||
      //   searchDevtoolsRenderersForClosestTarget(target);
      // if (found && found instanceof HTMLElement) {
      //   setCurrentElement(found);
      // }
    }
  }

  function clickListener(e) {
    if (!(0, _isCombinationModifiersPressed.isCombinationModifiersPressed)(e)) {
      return;
    }

    const target = e.target;

    if (target && target instanceof HTMLElement) {
      const elInfo = (0, _reactAdapter.getElementInfo)(target);

      if (elInfo) {
        const link = elInfo.thisElement.link;
        e.preventDefault();
        e.stopPropagation();
        (0, _trackClickStats.trackClickStats)();
        window.open(link, _consts.HREF_TARGET);
      }
    }
  }

  function scrollListener() {
    setCurrentElement(null);
  }

  document.addEventListener("mouseover", mouseOverListener, {
    capture: true
  });
  document.addEventListener("keydown", keyDownListener);
  document.addEventListener("keyup", keyUpListener);
  document.addEventListener("click", clickListener, {
    capture: true
  });
  document.addEventListener("scroll", scrollListener);
  (0, _solidJs.onCleanup)(() => {
    document.removeEventListener("keyup", keyUpListener);
    document.removeEventListener("keydown", keyDownListener);
    document.removeEventListener("mouseover", mouseOverListener, {
      capture: true
    });
    document.removeEventListener("click", clickListener, {
      capture: true
    });
    document.removeEventListener("scroll", scrollListener);
  });

  const getAllNodes = () => {
    if (solidMode() === "tree") {
      const foundFiberRoots = [];
      (0, _gatherFiberRoots.gatherFiberRoots)(document.body, foundFiberRoots);
      const simpleRoots = foundFiberRoots.map(fiber => {
        return (0, _fiberToSimple.fiberToSimple)(fiber);
      });
      return simpleRoots;
    } else {
      return [];
    }
  };

  return [(0, _web.memo)((() => {
    const _c$ = (0, _web.memo)(() => solidMode() === "tree", true);

    return () => _c$() ? (() => {
      const _el$ = _tmpl$.cloneNode(true);

      _el$.$$click = e => {
        setSolidMode(null);
      };

      _el$.style.setProperty("position", "fixed");

      _el$.style.setProperty("top", "0");

      _el$.style.setProperty("left", "0");

      _el$.style.setProperty("width", "50vw");

      _el$.style.setProperty("height", "100vh");

      _el$.style.setProperty("overflow", "auto");

      _el$.style.setProperty("pointer-events", "auto");

      (0, _web.insert)(_el$, (0, _web.createComponent)(_solidJs.For, {
        get each() {
          return getAllNodes();
        },

        children: (node, i) => (0, _web.createComponent)(TreeNode, {
          node: node
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
  })()), (0, _web.memo)(() => {
    if (!holdingModKey()) {
      return null;
    }

    const el = currentElement();

    if (!el) {
      return null;
    }

    const elInfo = (0, _reactAdapter.getElementInfo)(el);

    if (!elInfo) {
      return null;
    }

    return (0, _web.createComponent)(_Outline.Outline, {
      element: elInfo
    });
  })];
}

function initRender(solidLayer, adapter) {
  (0, _web.render)(() => (0, _web.createComponent)(Runtime, {
    adapter: adapter
  }), solidLayer);
}

function TreeNode({
  node
}) {
  return (() => {
    const _el$3 = _tmpl$3.cloneNode(true),
          _el$4 = _el$3.firstChild,
          _el$5 = _el$4.firstChild,
          _el$7 = _el$5.nextSibling,
          _el$6 = _el$7.nextSibling;

    _el$3.style.setProperty("padding-left", "1em");

    _el$3.style.setProperty("font-size", "14px");

    _el$3.style.setProperty("font-family", "monospace");

    (0, _web.insert)(_el$4, () => node.name, _el$7);
    (0, _web.insert)(_el$3, (() => {
      const _c$3 = (0, _web.memo)(() => {
        var _node$source;

        return !!(node.type === "component" && (_node$source = node.source) !== null && _node$source !== void 0 && _node$source.fileName);
      }, true);

      return () => _c$3() ? (() => {
        const _el$8 = _tmpl$4.cloneNode(true),
              _el$9 = _el$8.firstChild,
              _el$10 = _el$9.firstChild,
              _el$11 = _el$10.firstChild,
              _el$12 = _el$10.nextSibling,
              _el$13 = _el$12.nextSibling;

        _el$8.style.setProperty("border", "1px solid #ccc");

        _el$8.style.setProperty("padding", "0.5em");

        _el$9.style.setProperty("font-size", "12px");

        _el$9.style.setProperty("display", "flex");

        _el$9.style.setProperty("justify-content", "space-between");

        _el$9.style.setProperty("font-family", "Helvitica, sans-serif");

        _el$10.style.setProperty("font-weight", "bold");

        (0, _web.insert)(_el$10, () => node.name, _el$11);

        _el$13.style.setProperty("color", "#888");

        (0, _web.insert)(_el$13, () => {
          var _node$source2;

          return (_node$source2 = node.source) === null || _node$source2 === void 0 ? void 0 : _node$source2.fileName;
        });
        (0, _web.insert)(_el$8, (0, _web.createComponent)(_solidJs.For, {
          get each() {
            return node.children;
          },

          children: (child, i) => (0, _web.createComponent)(TreeNode, {
            node: child
          })
        }), null);
        return _el$8;
      })() : (0, _web.createComponent)(_solidJs.For, {
        get each() {
          return node.children;
        },

        children: (child, i) => (0, _web.createComponent)(TreeNode, {
          node: child
        })
      });
    })(), null);
    return _el$3;
  })();
}

(0, _web.delegateEvents)(["click"]);