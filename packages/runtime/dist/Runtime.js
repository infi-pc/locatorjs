"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.initRender = initRender;

var _web = require("solid-js/web");

var _solidJs = require("solid-js");

var _getUsableName = require("./getUsableName");

var _isCombinationModifiersPressed = require("./isCombinationModifiersPressed");

const _tmpl$ = /*#__PURE__*/(0, _web.template)(`<div>SOLID RUNTIME!!! mode: <!> </div>`, 3),
      _tmpl$2 = /*#__PURE__*/(0, _web.template)(`<div><div></div></div>`, 4);

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
  }); // const renderers = window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers;

  const getFoundPairs = () => {
    if (solidMode() === "xray") {
      const foundPairs = [];
      const foundFiberRoots = [];
      gatherFiberRoots(document.body, foundFiberRoots);
      foundFiberRoots.forEach(fiber => {
        gatherFiberChildren(fiber, foundPairs);
      });
      return foundPairs;
    } else {
      return [];
    }
  }; // createEffect(() => {});


  return (() => {
    const _el$ = _tmpl$.cloneNode(true),
          _el$2 = _el$.firstChild,
          _el$4 = _el$2.nextSibling,
          _el$3 = _el$4.nextSibling;

    (0, _web.insert)(_el$, solidMode, _el$4);
    (0, _web.insert)(_el$, (0, _web.createComponent)(_solidJs.For, {
      get each() {
        return getFoundPairs();
      },

      children: (pair, i) => (() => {
        const _el$5 = _tmpl$2.cloneNode(true),
              _el$6 = _el$5.firstChild;

        _el$5.style.setProperty("position", "absolute");

        _el$5.style.setProperty("border-radius", "4px");

        _el$6.style.setProperty("padding", "1px 4px");

        _el$6.style.setProperty("position", "absolute");

        _el$6.style.setProperty("font-size", "12px");

        _el$6.style.setProperty("border-radius", "0px 0px 4px 4px");

        _el$6.style.setProperty("height", "20px");

        _el$6.style.setProperty("white-space", "nowrap");

        (0, _web.insert)(_el$6, () => (0, _getUsableName.getUsableName)(pair.fiber));
        (0, _web.effect)(_p$ => {
          const _v$ = pair.box.left + "px",
                _v$2 = pair.box.top + "px",
                _v$3 = pair.box.width + "px",
                _v$4 = pair.box.height + "px",
                _v$5 = pair.type === "component" ? "4px solid green" : "1px solid red",
                _v$6 = pair.type === "component" ? "rgba(0,200,0,0.2)" : "rgba(200,0,0,0.2)",
                _v$7 = pair.type === "component" ? "rgba(50,150,50,1)" : "rgba(150,50,50,1)";

          _v$ !== _p$._v$ && _el$5.style.setProperty("left", _p$._v$ = _v$);
          _v$2 !== _p$._v$2 && _el$5.style.setProperty("top", _p$._v$2 = _v$2);
          _v$3 !== _p$._v$3 && _el$5.style.setProperty("width", _p$._v$3 = _v$3);
          _v$4 !== _p$._v$4 && _el$5.style.setProperty("height", _p$._v$4 = _v$4);
          _v$5 !== _p$._v$5 && _el$5.style.setProperty("border", _p$._v$5 = _v$5);
          _v$6 !== _p$._v$6 && _el$6.style.setProperty("background", _p$._v$6 = _v$6);
          _v$7 !== _p$._v$7 && _el$6.style.setProperty("color", _p$._v$7 = _v$7);
          return _p$;
        }, {
          _v$: undefined,
          _v$2: undefined,
          _v$3: undefined,
          _v$4: undefined,
          _v$5: undefined,
          _v$6: undefined,
          _v$7: undefined
        });
        return _el$5;
      })()
    }), null);
    return _el$;
  })();
} // function gatherNodes(parentNode: HTMLElement, mutable_foundPairs: Pair[]) {
//   const nodes = parentNode.childNodes;
//   for (let i = 0; i < nodes.length; i++) {
//     const node = nodes[i];
//     if (node instanceof HTMLElement) {
//       const fiber = findFiberByHtmlElement(node!, false);
//       if (fiber) {
//         mutable_foundPairs.push({
//           element: node,
//           fiber,
//           box: node.getBoundingClientRect(),
//         });
//       }
//       //  else {
//       // }
//       gatherNodes(node, mutable_foundPairs);
//     }
//   }
// }
// $0.
// function findGlobalRoots(): Fiber[] {
//   const foundRootPairs: Pair[] = [];
//   gatherRootNodes(document.body, foundRootPairs);
//   const set = new Set<Fiber>();
//   for (const rootPair of foundRootPairs) {
//     const globalRoot = findRoot(rootPair.fiber);
//     set.add(globalRoot);
//   }
//   return [...set.values()];
// }
// function findRoot(fiber: Fiber): Fiber {
//   if (fiber.return) {
//     return findRoot(fiber.return);
//   } else {
//     return fiber;
//   }
// }
// function gatherRootNodes(parentNode: HTMLElement, mutable_foundPairs: Pair[]) {
//   const nodes = parentNode.childNodes;
//   for (let i = 0; i < nodes.length; i++) {
//     const node = nodes[i];
//     if (node instanceof HTMLElement) {
//       const fiber = findFiberByHtmlElement(node!, false);
//       if (fiber) {
//         mutable_foundPairs.push({
//           element: node,
//           fiber,
//           box: node.getBoundingClientRect(),
//         });
//       } else {
//         gatherRootNodes(node, mutable_foundPairs);
//       }
//     }
//   }
// }


function gatherFiberRoots(parentNode, mutable_foundFibers) {
  const nodes = parentNode.childNodes;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    if (node instanceof HTMLElement) {
      var _reactRootContainer, _reactRootContainer$_;

      const fiber = (_reactRootContainer = node._reactRootContainer) === null || _reactRootContainer === void 0 ? void 0 : (_reactRootContainer$_ = _reactRootContainer._internalRoot) === null || _reactRootContainer$_ === void 0 ? void 0 : _reactRootContainer$_.current;

      if (fiber) {
        mutable_foundFibers.push(fiber);
      } else {
        gatherFiberRoots(node, mutable_foundFibers);
      }
    }
  }
}

function getAllFiberChildren(fiber) {
  const allChildren = [];
  let child = fiber.child;

  while (child) {
    allChildren.push(child);
    child = child.sibling;
  }

  return allChildren;
}

function gatherFiberChildren(fiber, mutable_foundPairs) {
  var _fiber$stateNode;

  const node = fiber.stateNode instanceof Element || fiber.stateNode instanceof Text ? fiber.stateNode : (_fiber$stateNode = fiber.stateNode) === null || _fiber$stateNode === void 0 ? void 0 : _fiber$stateNode.containerInfo;

  if (node) {
    const box = getBoundingRect(node);

    if (box) {
      mutable_foundPairs.push({
        fiber,
        element: node,
        box: box,
        type: "element"
      });
    }
  } else {
    var _fiber$elementType;

    if ((_fiber$elementType = fiber.elementType) !== null && _fiber$elementType !== void 0 && _fiber$elementType.name) {
      const box = getComposedBoundingBox(fiber);

      if (box) {
        console.log("Creating comp");
        mutable_foundPairs.push({
          fiber,
          element: node,
          box: box,
          type: "component"
        });
      }
    }

    console.log("NO NODE", fiber);
  }

  const children = getAllFiberChildren(fiber);

  for (const child of children) {
    gatherFiberChildren(child, mutable_foundPairs);
  }
}

function getBoundingRect(node) {
  if (node instanceof Element) {
    return node.getBoundingClientRect();
  } else if (node instanceof Text) {
    const range = document.createRange();
    range.selectNodeContents(node);
    return range.getBoundingClientRect();
  } else {
    return null;
  }
} // type DOMRectLike = {
//   left: number;
//   top: number;
//   width: number;
//   height: number;
// };


function mergeRects(a, b) {
  const newRect = new DOMRect();
  newRect.x = Math.min(a.x, b.x);
  newRect.y = Math.min(a.y, b.y);
  newRect.width = Math.max(a.x + a.width, b.x + b.width) - newRect.x;
  newRect.height = Math.max(a.y + a.height, b.y + b.height) - newRect.y;
  return newRect; // return {
  //   left: Math.min(a.x, b.x),
  //   top: Math.min(a.y, b.y),
  //   width: Math.max(a.right, b.right) - Math.min(a.x, b.x),
  //   height: Math.max(a.bottom, b.bottom) - Math.min(a.y, b.y),
  // };
}

function getComposedBoundingBox(fiber) {
  let composedRect = null;
  const children = getAllFiberChildren(fiber);
  children.forEach(child => {
    const rect = getBoundingRect(child.stateNode);

    if (rect) {
      if (composedRect) {
        composedRect = mergeRects(composedRect, rect);
      } else {
        composedRect = rect;
      }
    }
  });
  return composedRect;
}

function initRender(solidLayer) {
  (0, _web.render)(() => (0, _web.createComponent)(Runtime, {}), solidLayer);
}