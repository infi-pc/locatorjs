"use strict";

var _web = require("solid-js/web");

const _tmpl$ = /*#__PURE__*/(0, _web.template)(`<div class="locator-cloned-element"><div></div></div>`, 4);

function RenderNodeClone(props) {
  let myDiv;
  return (() => {
    const _el$ = _tmpl$.cloneNode(true),
          _el$2 = _el$.firstChild;

    _el$.style.setProperty("position", "absolute");

    _el$.style.setProperty("box-shadow", "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1), 0 25px 50px -12px rgb(0 0 0 / 0.25)");

    _el$.style.setProperty("background", "rgba(255,255,255,1)");

    _el$.style.setProperty("border-radius", "5px");

    _el$.style.setProperty("cursor", "pointer");

    _el$.style.setProperty("overflow", "hidden");

    const _ref$ = myDiv;
    typeof _ref$ === "function" ? _ref$(_el$2) : myDiv = _el$2;

    _el$2.style.setProperty("pointer-events", "none");

    (0, _web.effect)(_p$ => {
      const _v$ = props.box.left + "px",
            _v$2 = props.box.top + "px",
            _v$3 = props.box.width + "px",
            _v$4 = props.box.height + "px";

      _v$ !== _p$._v$ && _el$.style.setProperty("left", _p$._v$ = _v$);
      _v$2 !== _p$._v$2 && _el$.style.setProperty("top", _p$._v$2 = _v$2);
      _v$3 !== _p$._v$3 && _el$.style.setProperty("width", _p$._v$3 = _v$3);
      _v$4 !== _p$._v$4 && _el$.style.setProperty("height", _p$._v$4 = _v$4);
      return _p$;
    }, {
      _v$: undefined,
      _v$2: undefined,
      _v$3: undefined,
      _v$4: undefined
    });
    return _el$;
  })();
}