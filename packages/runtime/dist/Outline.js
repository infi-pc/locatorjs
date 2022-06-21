"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Outline = Outline;

var _web = require("solid-js/web");

var _solidJs = require("solid-js");

var _getLabels = require("./getLabels");

var _trackClickStats = require("./trackClickStats");

const _tmpl$ = /*#__PURE__*/(0, _web.template)(`<div><div id="locatorjs-labels-section"><div id="locatorjs-labels-wrapper"></div></div></div>`, 6),
      _tmpl$2 = /*#__PURE__*/(0, _web.template)(`<a class="locatorjs-label" target="_self"></a>`, 2);

const HREF_TARGET = "_self";
const PADDING = 6;
const baseColor = "#e90139";

function Outline(props) {
  const bbox = () => props.element.getBoundingClientRect();

  const isReversed = () => bbox().y < 30;

  let labels = () => (0, _getLabels.getLabels)(props.element);

  return (() => {
    const _el$ = _tmpl$.cloneNode(true),
          _el$2 = _el$.firstChild,
          _el$3 = _el$2.firstChild;

    _el$.style.setProperty("position", "absolute");

    _el$.style.setProperty("border", "2px solid #e90139");

    _el$.style.setProperty("border-radius", "8px");

    (0, _web.insert)(_el$3, (0, _web.createComponent)(_solidJs.For, {
      get each() {
        return labels();
      },

      children: (label, i) => (() => {
        const _el$4 = _tmpl$2.cloneNode(true);

        _el$4.$$click = () => {
          (0, _trackClickStats.trackClickStats)();
          window.open(label.link, HREF_TARGET);
        };

        (0, _web.insert)(_el$4, () => label.label);
        (0, _web.effect)(() => (0, _web.setAttribute)(_el$4, "href", label.link));
        return _el$4;
      })()
    }));
    (0, _web.effect)(_p$ => {
      const _v$ = bbox().x - PADDING + "px",
            _v$2 = bbox().y - PADDING + "px",
            _v$3 = bbox().width + PADDING * 2 + "px",
            _v$4 = bbox().height + PADDING * 2 + "px",
            _v$5 = {
        position: "absolute",
        display: "flex",
        "justify-content": "center",
        bottom: isReversed() ? "-28px" : undefined,
        top: isReversed() ? undefined : "-28px",
        left: "0px",
        width: "100%",
        "pointer-events": "auto",
        ...(isReversed() ? {
          "border-bottom-left-radius": "100%",
          "border-bottom-right-radius": "100%"
        } : {
          "border-top-left-radius": "100%",
          "border-top-right-radius": "100%"
        })
      },
            _v$6 = isReversed() ? "10px 10px 2px 10px" : "2px 10px 10px 10px";

      _v$ !== _p$._v$ && _el$.style.setProperty("left", _p$._v$ = _v$);
      _v$2 !== _p$._v$2 && _el$.style.setProperty("top", _p$._v$2 = _v$2);
      _v$3 !== _p$._v$3 && _el$.style.setProperty("width", _p$._v$3 = _v$3);
      _v$4 !== _p$._v$4 && _el$.style.setProperty("height", _p$._v$4 = _v$4);
      _p$._v$5 = (0, _web.style)(_el$2, _v$5, _p$._v$5);
      _v$6 !== _p$._v$6 && _el$3.style.setProperty("padding", _p$._v$6 = _v$6);
      return _p$;
    }, {
      _v$: undefined,
      _v$2: undefined,
      _v$3: undefined,
      _v$4: undefined,
      _v$5: undefined,
      _v$6: undefined
    });
    return _el$;
  })();
}

(0, _web.delegateEvents)(["click"]);