"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SimpleNodeOutline = SimpleNodeOutline;

var _web = require("solid-js/web");

const _tmpl$ = /*#__PURE__*/(0, _web.template)(`<div></div>`, 2);

function SimpleNodeOutline(props) {
  const offset = props.node.type === "component" ? 2 : 0;
  return (() => {
    const _el$ = _tmpl$.cloneNode(true);

    (0, _web.insert)(_el$, (() => {
      const _c$ = (0, _web.memo)(() => !!props.node.box, true);

      return () => _c$() ? (() => {
        const _el$2 = _tmpl$.cloneNode(true);

        _el$2.style.setProperty("position", "absolute");

        (0, _web.effect)(_p$ => {
          const _v$ = props.node.box.x - offset + "px",
                _v$2 = props.node.box.y - offset + "px",
                _v$3 = props.node.box.width + offset * 2 + "px",
                _v$4 = props.node.box.height + offset * 2 + "px",
                _v$5 = props.node.type === "component" ? "2px solid rgba(200,0,0,1)" : "1px solid rgba(200,0,0,1)",
                _v$6 = props.node.type === "component" ? "5px" : "3px",
                _v$7 = props.node.type === "component" ? 1000 : 10;

          _v$ !== _p$._v$ && _el$2.style.setProperty("left", _p$._v$ = _v$);
          _v$2 !== _p$._v$2 && _el$2.style.setProperty("top", _p$._v$2 = _v$2);
          _v$3 !== _p$._v$3 && _el$2.style.setProperty("width", _p$._v$3 = _v$3);
          _v$4 !== _p$._v$4 && _el$2.style.setProperty("height", _p$._v$4 = _v$4);
          _v$5 !== _p$._v$5 && _el$2.style.setProperty("border", _p$._v$5 = _v$5);
          _v$6 !== _p$._v$6 && _el$2.style.setProperty("border-radius", _p$._v$6 = _v$6);
          _v$7 !== _p$._v$7 && _el$2.style.setProperty("z-index", _p$._v$7 = _v$7);
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
        return _el$2;
      })() : null;
    })());
    return _el$;
  })();
}