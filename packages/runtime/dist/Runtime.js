"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.initRender = initRender;

var _web = require("solid-js/web");

var _solidJs = require("solid-js");

var _findFiberByHtmlElement = require("./findFiberByHtmlElement");

var _getUsableName = require("./getUsableName");

var _isCombinationModifiersPressed = require("./isCombinationModifiersPressed");

const _tmpl$ = /*#__PURE__*/(0, _web.template)(`<div id="locator-solid-overlay"><div></div></div>`, 4),
      _tmpl$2 = /*#__PURE__*/(0, _web.template)(`<div></div>`, 2),
      _tmpl$3 = /*#__PURE__*/(0, _web.template)(`<div class="locator-cloned-element"><div></div></div>`, 4);

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

  const getFoundNodes = () => {
    if (solidMode() === "xray") {
      const foundFiberRoots = [];
      gatherFiberRoots(document.body, foundFiberRoots);
      console.log({
        foundFiberRoots
      });
      const simpleRoots = foundFiberRoots.map(fiber => {
        return fiberToSimple(fiber);
      });
      return simpleRoots;
    } else {
      return [];
    }
  };

  (0, _solidJs.createEffect)(() => {
    if (solidMode()) {
      document.body.classList.add("locator-solid-mode");
    } else {
      document.body.classList.remove("locator-solid-mode");
    }
  });
  return (0, _web.memo)((() => {
    const _c$ = (0, _web.memo)(() => !!solidMode(), true);

    return () => _c$() ? (() => {
      const _el$ = _tmpl$.cloneNode(true),
            _el$2 = _el$.firstChild;

      _el$.$$click = e => {
        setSolidMode(null);
      };

      _el$2.style.setProperty("transform", "scale(0.7)");

      (0, _web.insert)(_el$2, (0, _web.createComponent)(_solidJs.For, {
        get each() {
          return getFoundNodes();
        },

        children: (node, i) => (0, _web.createComponent)(RenderNode, {
          node: node,
          parentIsHovered: false
        })
      }));
      return _el$;
    })() : null;
  })());
}

function RenderNode(props) {
  const [isHovered, setIsHovered] = (0, _solidJs.createSignal)(false);
  (0, _solidJs.createEffect)(() => {
    console.log("RenderNode", props.node, props.parentIsHovered, isHovered());
  });
  const offset = props.node.type === "component" ? 2 : 0;
  return (() => {
    const _el$3 = _tmpl$2.cloneNode(true);

    (0, _web.insert)(_el$3, (() => {
      const _c$2 = (0, _web.memo)(() => !!props.node.box, true);

      return () => _c$2() ? (() => {
        const _el$4 = _tmpl$2.cloneNode(true);

        (0, _web.addEventListener)(_el$4, "mouseleave", props.node.type === "component" ? () => setIsHovered(false) : undefined);
        (0, _web.addEventListener)(_el$4, "mouseenter", props.node.type === "component" ? () => setIsHovered(true) : undefined);

        _el$4.style.setProperty("position", "absolute");

        (0, _web.insert)(_el$4, (() => {
          const _c$4 = (0, _web.memo)(() => !!(props.node.type === "component" || props.parentIsHovered), true);

          return () => _c$4() ? (() => {
            const _el$5 = _tmpl$2.cloneNode(true);

            _el$5.style.setProperty("padding", "1px 4px");

            _el$5.style.setProperty("position", "absolute");

            _el$5.style.setProperty("font-size", "12px");

            _el$5.style.setProperty("border-radius", "0px 0px 4px 4px");

            _el$5.style.setProperty("height", "20px");

            _el$5.style.setProperty("white-space", "nowrap");

            (0, _web.insert)(_el$5, () => props.node.name);
            (0, _web.effect)(_p$ => {
              const _v$8 = props.node.type === "component" ? "rgba(0,200,0,0.2)" : "",
                    _v$9 = props.node.type === "component" ? "rgba(50,150,50,1)" : "rgba(150,50,50,1)";

              _v$8 !== _p$._v$8 && _el$5.style.setProperty("background", _p$._v$8 = _v$8);
              _v$9 !== _p$._v$9 && _el$5.style.setProperty("color", _p$._v$9 = _v$9);
              return _p$;
            }, {
              _v$8: undefined,
              _v$9: undefined
            });
            return _el$5;
          })() : null;
        })());
        (0, _web.effect)(_p$ => {
          const _v$ = props.node.box.left - offset + "px",
                _v$2 = props.node.box.top - offset + "px",
                _v$3 = props.node.box.width + offset * 2 + "px",
                _v$4 = props.node.box.height + offset * 2 + "px",
                _v$5 = isHovered() || props.parentIsHovered ? props.node.type === "component" ? "2px solid rgba(100,0,0,1)" : "1px solid rgba(200,0,0,0.6)" : props.node.type === "component" ? "0px solid rgba(200,0,0,1)" : "0px solid rgba(200,0,0,0.1)",
                _v$6 = props.node.type === "component" ? "5px" : "3px",
                _v$7 = props.node.type === "component" ? 1000 : 10;

          _v$ !== _p$._v$ && _el$4.style.setProperty("left", _p$._v$ = _v$);
          _v$2 !== _p$._v$2 && _el$4.style.setProperty("top", _p$._v$2 = _v$2);
          _v$3 !== _p$._v$3 && _el$4.style.setProperty("width", _p$._v$3 = _v$3);
          _v$4 !== _p$._v$4 && _el$4.style.setProperty("height", _p$._v$4 = _v$4);
          _v$5 !== _p$._v$5 && _el$4.style.setProperty("border", _p$._v$5 = _v$5);
          _v$6 !== _p$._v$6 && _el$4.style.setProperty("border-radius", _p$._v$6 = _v$6);
          _v$7 !== _p$._v$7 && _el$4.style.setProperty("z-index", _p$._v$7 = _v$7);
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
        return _el$4;
      })() : null;
    })(), null);
    (0, _web.insert)(_el$3, (() => {
      const _c$3 = (0, _web.memo)(() => props.node.type === "component", true);

      return () => _c$3() ? (0, _web.createComponent)(_solidJs.For, {
        get each() {
          return props.node.children;
        },

        children: (childNode, i) => {
          if (childNode.type === "element" && childNode.element instanceof HTMLElement && childNode.box) {
            return (0, _web.createComponent)(RenderNodeClone, {
              get element() {
                return childNode.element;
              },

              get box() {
                return childNode.box;
              },

              get isHovered() {
                return isHovered();
              }

            });
          }

          return null;
        }
      }) : null;
    })(), null);
    (0, _web.insert)(_el$3, (0, _web.createComponent)(_solidJs.For, {
      get each() {
        return props.node.children;
      },

      children: (childNode, i) => {
        return (0, _web.createComponent)(RenderNode, {
          node: childNode,

          get parentIsHovered() {
            return isHovered() || props.node.type === "element" && props.parentIsHovered;
          }

        });
      }
    }), null);
    return _el$3;
  })();
}

function RenderNodeClone(props) {
  let myDiv;
  (0, _solidJs.onMount)(() => {
    if (myDiv) {
      const clone = props.element.cloneNode(true);
      myDiv.appendChild(clone); // html2canvas(document.body).then(function (canvas) {
      //   myDiv!.appendChild(canvas);
      // });
    }
  });
  return (() => {
    const _el$6 = _tmpl$3.cloneNode(true),
          _el$7 = _el$6.firstChild;

    _el$6.style.setProperty("position", "absolute");

    _el$6.style.setProperty("box-shadow", "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1), 0 25px 50px -12px rgb(0 0 0 / 0.25)");

    _el$6.style.setProperty("background", "rgba(255,255,255,1)");

    _el$6.style.setProperty("border-radius", "5px");

    _el$6.style.setProperty("cursor", "pointer");

    _el$6.style.setProperty("overflow", "hidden");

    const _ref$ = myDiv;
    typeof _ref$ === "function" ? _ref$(_el$7) : myDiv = _el$7;

    _el$7.style.setProperty("pointer-events", "none");

    (0, _web.effect)(_p$ => {
      const _v$10 = props.box.left + "px",
            _v$11 = props.box.top + "px",
            _v$12 = props.box.width + "px",
            _v$13 = props.box.height + "px",
            _v$14 = props.isHovered ? "scale(1)" : "scale(0.97)";

      _v$10 !== _p$._v$10 && _el$6.style.setProperty("left", _p$._v$10 = _v$10);
      _v$11 !== _p$._v$11 && _el$6.style.setProperty("top", _p$._v$11 = _v$11);
      _v$12 !== _p$._v$12 && _el$6.style.setProperty("width", _p$._v$12 = _v$12);
      _v$13 !== _p$._v$13 && _el$6.style.setProperty("height", _p$._v$13 = _v$13);
      _v$14 !== _p$._v$14 && _el$6.style.setProperty("transform", _p$._v$14 = _v$14);
      return _p$;
    }, {
      _v$10: undefined,
      _v$11: undefined,
      _v$12: undefined,
      _v$13: undefined,
      _v$14: undefined
    });
    return _el$6;
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
      var _reactRootContainer, _reactRootContainer$_, _reactRootContainer2;

      const fiber = ((_reactRootContainer = node._reactRootContainer) === null || _reactRootContainer === void 0 ? void 0 : (_reactRootContainer$_ = _reactRootContainer._internalRoot) === null || _reactRootContainer$_ === void 0 ? void 0 : _reactRootContainer$_.current) || ((_reactRootContainer2 = node._reactRootContainer) === null || _reactRootContainer2 === void 0 ? void 0 : _reactRootContainer2.current);

      if (fiber) {
        mutable_foundFibers.push(fiber);
      } else {
        const rootFiber = (0, _findFiberByHtmlElement.findFiberByHtmlElement)(node, false);

        if (rootFiber) {
          mutable_foundFibers.push(rootFiber);
        } else {
          gatherFiberRoots(node, mutable_foundFibers);
        }
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

function fiberToSimple(fiber) {
  var _fiber$stateNode;

  const children = getAllFiberChildren(fiber);
  const simpleChildren = children.map(child => {
    return fiberToSimple(child);
  });
  const element = fiber.stateNode instanceof Element || fiber.stateNode instanceof Text ? fiber.stateNode : (_fiber$stateNode = fiber.stateNode) === null || _fiber$stateNode === void 0 ? void 0 : _fiber$stateNode.containerInfo;

  if (element) {
    const box = getBoundingRect(element);
    return {
      type: "element",
      element: element,
      fiber: fiber,
      name: (0, _getUsableName.getUsableName)(fiber),
      box: box || getComposedBoundingBox(simpleChildren),
      children: simpleChildren
    };
  } else {
    return {
      type: "component",
      fiber: fiber,
      name: (0, _getUsableName.getUsableName)(fiber),
      box: getComposedBoundingBox(simpleChildren),
      children: simpleChildren
    };
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
}

function mergeRects(a, b) {
  const newRect = new DOMRect();
  newRect.x = Math.min(a.x, b.x);
  newRect.y = Math.min(a.y, b.y);
  newRect.width = Math.max(a.x + a.width, b.x + b.width) - newRect.x;
  newRect.height = Math.max(a.y + a.height, b.y + b.height) - newRect.y;
  return newRect;
}

function getComposedBoundingBox(children) {
  let composedRect = null;
  children.forEach(child => {
    const box = child.box;

    if (!box) {
      return;
    }

    if (box.width <= 0 || box.height <= 0) {
      // ignore zero-sized rects
      return;
    }

    if (composedRect) {
      composedRect = mergeRects(composedRect, box);
    } else {
      composedRect = box;
    }
  });
  return composedRect;
}

function initRender(solidLayer) {
  (0, _web.render)(() => (0, _web.createComponent)(Runtime, {}), solidLayer);
}

(0, _web.delegateEvents)(["click"]);