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

var _trackClickStats = require("./trackClickStats");

var _getIdsOnPathToRoot = require("./getIdsOnPathToRoot");

var _RootTreeNode = require("./RootTreeNode");

var _MaybeOutline = require("./MaybeOutline");

var _findFiberByHtmlElement = require("./adapters/react/findFiberByHtmlElement");

var _SimpleNodeOutline = require("./SimpleNodeOutline");

var _hasExperimentalFeatures = require("./hasExperimentalFeatures");

const _tmpl$ = /*#__PURE__*/(0, _web.template)(`<div id="locator-solid-overlay"></div>`, 2),
      _tmpl$2 = /*#__PURE__*/(0, _web.template)(`<div>LocatorJS</div>`, 2);

function Runtime(props) {
  const [solidMode, setSolidMode] = (0, _solidJs.createSignal)(["off"]);
  const [holdingModKey, setHoldingModKey] = (0, _solidJs.createSignal)(false);
  const [currentElement, setCurrentElement] = (0, _solidJs.createSignal)(null);
  const [highlightedNode, setHighlightedNode] = (0, _solidJs.createSignal)(null);
  (0, _solidJs.createEffect)(() => {
    if (holdingModKey() && currentElement()) {
      document.body.classList.add("locatorjs-active-pointer");
    } else {
      document.body.classList.remove("locatorjs-active-pointer");
    }
  });
  (0, _solidJs.createEffect)(() => {
    if (solidMode()[0] === "tree" || solidMode()[0] === "treeFromElement") {
      document.body.classList.add("locatorjs-move-body");
    } else {
      document.body.classList.remove("locatorjs-move-body");
    }
  });

  function keyUpListener(e) {
    if ((0, _hasExperimentalFeatures.hasExperimentalFeatures)()) {
      if (e.code === "KeyO" && (0, _isCombinationModifiersPressed.isCombinationModifiersPressed)(e)) {
        if (solidMode()[0] === "tree") {
          setSolidMode(["off"]);
        } else {
          setSolidMode(["tree"]);
        }
      }
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

      if (target.matches("#locatorjs-wrapper *")) {
        return;
      }

      (0, _solidJs.batch)(() => {
        setCurrentElement(target);

        if (solidMode()[0] === "tree" || solidMode()[0] === "treeFromElement") {
          const fiber = (0, _findFiberByHtmlElement.findFiberByHtmlElement)(target, false);

          if (fiber) {
            const id = (0, _fiberToSimple.fiberToSimple)(fiber, []);
            setHighlightedNode(id);
          }
        }
      }); // const found =
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
      if (target.matches("#locatorjs-wrapper *")) {
        return;
      }

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
    if (solidMode()[0] === "tree" || solidMode()[0] === "treeFromElement") {
      const foundFiberRoots = [];
      (0, _gatherFiberRoots.gatherFiberRoots)(document.body, foundFiberRoots);
      const simpleRoots = foundFiberRoots.map(fiber => {
        return (0, _fiberToSimple.fiberToSimple)(fiber);
      });
      return simpleRoots;
    } //  else if () {
    //   const pathToParentTree = getIdsOnPathToRoot(solidMode()[1]!);
    //   if (pathToParentTree) {
    //     return [pathToParentTree];
    //   }
    // }


    return [];
  };

  function showTreeFromElement(element) {
    setSolidMode(["treeFromElement", element]);
  }

  return [(0, _web.memo)((() => {
    const _c$ = (0, _web.memo)(() => !!(solidMode()[0] === "tree" || solidMode()[0] === "treeFromElement"), true);

    return () => _c$() ? (() => {
      const _el$ = _tmpl$.cloneNode(true);

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

        children: (node, i) => (0, _web.createComponent)(_RootTreeNode.RootTreeNode, {
          node: node,

          get idsToShow() {
            return (0, _web.memo)(() => solidMode()[0] === "treeFromElement", true)() ? (0, _getIdsOnPathToRoot.getIdsOnPathToRoot)(solidMode()[1]) : {};
          },

          highlightedNode: {
            getNode: highlightedNode,
            setNode: newId => {
              setHighlightedNode(newId);
            }
          }
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

    return () => _c$3() ? (0, _web.createComponent)(_MaybeOutline.MaybeOutline, {
      get currentElement() {
        return currentElement();
      },

      showTreeFromElement: showTreeFromElement
    }) : null;
  })()), (0, _web.memo)((() => {
    const _c$4 = (0, _web.memo)(() => !!highlightedNode(), true);

    return () => _c$4() ? (0, _web.createComponent)(_SimpleNodeOutline.SimpleNodeOutline, {
      get node() {
        return highlightedNode();
      }

    }) : null;
  })())];
}

function initRender(solidLayer, adapter) {
  (0, _web.render)(() => (0, _web.createComponent)(Runtime, {
    adapter: adapter
  }), solidLayer);
}