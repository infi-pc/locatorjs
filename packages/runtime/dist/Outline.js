"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Outline = Outline;

var _web = require("solid-js/web");

var _solidJs = require("solid-js");

var _consts = require("./consts");

var _trackClickStats = require("./trackClickStats");

const _tmpl$ = /*#__PURE__*/(0, _web.template)(`<div><div></div></div>`, 4),
      _tmpl$2 = /*#__PURE__*/(0, _web.template)(`<div><div id="locatorjs-labels-section"><div id="locatorjs-labels-wrapper"></div></div></div>`, 6),
      _tmpl$3 = /*#__PURE__*/(0, _web.template)(`<a class="locatorjs-label"></a>`, 2);

function Outline(props) {
  const box = () => props.element.thisElement.box;

  return [(() => {
    const _el$ = _tmpl$.cloneNode(true),
          _el$2 = _el$.firstChild;

    _el$2.style.setProperty("position", "fixed");

    _el$2.style.setProperty("background-color", "rgba(222, 0, 0, 0.3)");

    _el$2.style.setProperty("border", "1px solid rgba(222, 0, 0, 0.5)");

    _el$2.style.setProperty("border-radius", "2px");

    (0, _web.effect)(_p$ => {
      const _v$ = box().x + "px",
            _v$2 = box().y + "px",
            _v$3 = box().width + "px",
            _v$4 = box().height + "px";

      _v$ !== _p$._v$ && _el$2.style.setProperty("left", _p$._v$ = _v$);
      _v$2 !== _p$._v$2 && _el$2.style.setProperty("top", _p$._v$2 = _v$2);
      _v$3 !== _p$._v$3 && _el$2.style.setProperty("width", _p$._v$3 = _v$3);
      _v$4 !== _p$._v$4 && _el$2.style.setProperty("height", _p$._v$4 = _v$4);
      return _p$;
    }, {
      _v$: undefined,
      _v$2: undefined,
      _v$3: undefined,
      _v$4: undefined
    });
    return _el$;
  })(), (0, _web.createComponent)(ComponentOutline, {
    get labels() {
      return props.element.componentsLabels;
    },

    get bbox() {
      return props.element.componentBox;
    }

  })];
}

function ComponentOutline(props) {
  const isReversed = () => props.bbox.y < 30;

  return (() => {
    const _el$3 = _tmpl$2.cloneNode(true),
          _el$4 = _el$3.firstChild,
          _el$5 = _el$4.firstChild;

    _el$3.style.setProperty("position", "fixed");

    _el$3.style.setProperty("border", "2px solid " + _consts.baseColor);

    _el$3.style.setProperty("border-radius", "8px");

    (0, _web.insert)(_el$5, (0, _web.createComponent)(_solidJs.For, {
      get each() {
        return props.labels;
      },

      children: (label, i) => (() => {
        const _el$6 = _tmpl$3.cloneNode(true);

        _el$6.$$click = () => {
          (0, _trackClickStats.trackClickStats)();
          window.open(label.link, _consts.HREF_TARGET);
        };

        (0, _web.setAttribute)(_el$6, "target", _consts.HREF_TARGET);
        (0, _web.insert)(_el$6, () => label.label);
        (0, _web.effect)(() => (0, _web.setAttribute)(_el$6, "href", label.link));
        return _el$6;
      })()
    }));
    (0, _web.effect)(_p$ => {
      const _v$5 = props.bbox.x - _consts.PADDING + "px",
            _v$6 = props.bbox.y - _consts.PADDING + "px",
            _v$7 = props.bbox.width + _consts.PADDING * 2 + "px",
            _v$8 = props.bbox.height + _consts.PADDING * 2 + "px",
            _v$9 = {
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
            _v$10 = isReversed() ? "10px 10px 2px 10px" : "2px 10px 10px 10px";

      _v$5 !== _p$._v$5 && _el$3.style.setProperty("left", _p$._v$5 = _v$5);
      _v$6 !== _p$._v$6 && _el$3.style.setProperty("top", _p$._v$6 = _v$6);
      _v$7 !== _p$._v$7 && _el$3.style.setProperty("width", _p$._v$7 = _v$7);
      _v$8 !== _p$._v$8 && _el$3.style.setProperty("height", _p$._v$8 = _v$8);
      _p$._v$9 = (0, _web.style)(_el$4, _v$9, _p$._v$9);
      _v$10 !== _p$._v$10 && _el$5.style.setProperty("padding", _p$._v$10 = _v$10);
      return _p$;
    }, {
      _v$5: undefined,
      _v$6: undefined,
      _v$7: undefined,
      _v$8: undefined,
      _v$9: undefined,
      _v$10: undefined
    });
    return _el$3;
  })();
}

(0, _web.delegateEvents)(["click"]);