"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TreeNode = TreeNode;

var _web = require("solid-js/web");

var _solidJs = require("solid-js");

const _tmpl$ = /*#__PURE__*/(0, _web.template)(`<div class="locatorjs-tree-node"><button>&lt;<!>></button></div>`, 5),
      _tmpl$2 = /*#__PURE__*/(0, _web.template)(`<div><div><div>:</div> <div></div></div></div>`, 8),
      _tmpl$3 = /*#__PURE__*/(0, _web.template)(`<button>...</button>`, 2);

function TreeNode(props) {
  const [manuallyExpanded, setManuallyExpanded] = (0, _solidJs.createSignal)(false);

  function isExpanded() {
    return manuallyExpanded() || props.idsThatHaveExpandedSuccessor[props.node.uniqueId];
  }

  function renderChildren() {
    return (0, _web.createComponent)(_solidJs.For, {
      get each() {
        return props.node.children;
      },

      children: (child, i) => (0, _web.createComponent)(TreeNode, {
        node: child,

        get idsToShow() {
          return props.idsToShow;
        },

        get idsThatHaveExpandedSuccessor() {
          return props.idsThatHaveExpandedSuccessor;
        }

      })
    });
  }

  return (() => {
    const _el$ = _tmpl$.cloneNode(true),
          _el$2 = _el$.firstChild,
          _el$3 = _el$2.firstChild,
          _el$5 = _el$3.nextSibling,
          _el$4 = _el$5.nextSibling;

    _el$.style.setProperty("padding-left", "1em");

    _el$.style.setProperty("font-size", "14px");

    _el$.style.setProperty("font-family", "monospace");

    _el$.style.setProperty("min-width", "300px");

    _el$.style.setProperty("pointer-events", "auto");

    _el$.style.setProperty("cursor", "pointer");

    _el$2.$$click = () => {
      console.log(props.node.fiber);
    };

    (0, _web.insert)(_el$2, () => props.node.name, _el$5);
    (0, _web.insert)(_el$, (() => {
      const _c$ = (0, _web.memo)(() => !!isExpanded(), true);

      return () => _c$() ? (0, _web.memo)((() => {
        const _c$3 = (0, _web.memo)(() => {
          var _props$node$source;

          return !!(props.node.type === "component" && (_props$node$source = props.node.source) !== null && _props$node$source !== void 0 && _props$node$source.fileName);
        }, true);

        return () => _c$3() ? (() => {
          const _el$6 = _tmpl$2.cloneNode(true),
                _el$7 = _el$6.firstChild,
                _el$8 = _el$7.firstChild,
                _el$9 = _el$8.firstChild,
                _el$10 = _el$8.nextSibling,
                _el$11 = _el$10.nextSibling;

          _el$6.style.setProperty("border", "1px solid #ccc");

          _el$6.style.setProperty("padding", "0.5em");

          _el$6.style.setProperty("min-width", "300px");

          _el$7.style.setProperty("font-size", "12px");

          _el$7.style.setProperty("display", "flex");

          _el$7.style.setProperty("justify-content", "space-between");

          _el$7.style.setProperty("font-family", "Helvitica, sans-serif");

          _el$8.style.setProperty("font-weight", "bold");

          (0, _web.insert)(_el$8, () => props.node.name, _el$9);

          _el$11.style.setProperty("color", "#888");

          (0, _web.insert)(_el$11, () => props.node.definitionSourceFile);
          (0, _web.insert)(_el$6, renderChildren, null);
          return _el$6;
        })() : renderChildren();
      })()) : (() => {
        const _c$2 = (0, _web.memo)(() => !!props.node.children.length, true);

        return () => _c$2() ? (() => {
          const _el$12 = _tmpl$3.cloneNode(true);

          _el$12.$$click = () => {
            setManuallyExpanded(true);
          };

          return _el$12;
        })() : null;
      })();
    })(), null);
    (0, _web.effect)(_p$ => {
      const _v$ = props.idsToShow[props.node.uniqueId] ? "yellow" : "",
            _v$2 = props.idsThatHaveExpandedSuccessor[props.node.uniqueId] ? "1px solid red" : "1px solid black";

      _v$ !== _p$._v$ && _el$2.style.setProperty("background-color", _p$._v$ = _v$);
      _v$2 !== _p$._v$2 && _el$2.style.setProperty("border", _p$._v$2 = _v$2);
      return _p$;
    }, {
      _v$: undefined,
      _v$2: undefined
    });
    return _el$;
  })();
}

(0, _web.delegateEvents)(["click"]);