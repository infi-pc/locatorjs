"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Outline = Outline;

var _web = require("solid-js/web");

var _solidJs = require("solid-js");

var _consts = require("./consts");

var _trackClickStats = require("./trackClickStats");

var _hasExperimentalFeatures = require("./hasExperimentalFeatures");

var _goTo = require("./goTo");

const _tmpl$ = /*#__PURE__*/(0, _web.template)(`<div><div></div></div>`, 4),
      _tmpl$2 = /*#__PURE__*/(0, _web.template)(`<div><div id="locatorjs-labels-section"><div id="locatorjs-labels-wrapper"></div></div></div>`, 6),
      _tmpl$3 = /*#__PURE__*/(0, _web.template)(`<a class="locatorjs-label"><svg style="width:16px;height:16px" viewBox="0 0 24 24"><path fill="currentColor" d="M3,3H9V7H3V3M15,10H21V14H15V10M15,17H21V21H15V17M13,13H7V18H13V20H7L5,20V9H7V11H13V13Z"></path></svg></a>`, 6),
      _tmpl$4 = /*#__PURE__*/(0, _web.template)(`<a class="locatorjs-label"></a>`, 2);

function Outline(props) {
  const box = () => props.element.thisElement.box;

  return [(() => {
    const _el$ = _tmpl$.cloneNode(true),
          _el$2 = _el$.firstChild;

    _el$2.style.setProperty("position", "fixed");

    _el$2.style.setProperty("background-color", "rgba(222, 0, 0, 0.3)");

    _el$2.style.setProperty("border", "1px solid rgba(222, 0, 0, 0.5)");

    _el$2.style.setProperty("border-radius", "2px");

    _el$2.style.setProperty("color", "rgba(222, 0, 0, 1)");

    _el$2.style.setProperty("overflow", "hidden");

    _el$2.style.setProperty("padding-left", "4px");

    _el$2.style.setProperty("font-size", "12px");

    _el$2.style.setProperty("font-weight", "bold");

    _el$2.style.setProperty("text-shadow", "-1px 1px 0 #fff, 1px 1px 0 #fff, 1px -1px 0 #fff, -1px -1px 0 #fff");

    _el$2.style.setProperty("text-overflow", "ellipsis");

    (0, _web.insert)(_el$2, () => props.element.thisElement.label);
    (0, _web.effect)(_p$ => {
      const _v$ = box().x + "px",
            _v$2 = box().y + "px",
            _v$3 = box().width + "px",
            _v$4 = box().height + "px",
            _v$5 = box().height > 20 ? "4px" : "0px";

      _v$ !== _p$._v$ && _el$2.style.setProperty("left", _p$._v$ = _v$);
      _v$2 !== _p$._v$2 && _el$2.style.setProperty("top", _p$._v$2 = _v$2);
      _v$3 !== _p$._v$3 && _el$2.style.setProperty("width", _p$._v$3 = _v$3);
      _v$4 !== _p$._v$4 && _el$2.style.setProperty("height", _p$._v$4 = _v$4);
      _v$5 !== _p$._v$5 && _el$2.style.setProperty("padding-top", _p$._v$5 = _v$5);
      return _p$;
    }, {
      _v$: undefined,
      _v$2: undefined,
      _v$3: undefined,
      _v$4: undefined,
      _v$5: undefined
    });
    return _el$;
  })(), (0, _web.createComponent)(ComponentOutline, {
    get labels() {
      return props.element.componentsLabels;
    },

    get bbox() {
      return props.element.componentBox;
    },

    get element() {
      return props.element.htmlElement;
    },

    get showTreeFromElement() {
      return props.showTreeFromElement;
    }

  })];
}

function ComponentOutline(props) {
  const isInside = () => props.bbox.height >= window.innerHeight - 40;

  const isBelow = () => props.bbox.y < 30 && !isInside();

  const left = () => Math.max(props.bbox.x - _consts.PADDING, 0);

  const top = () => Math.max(props.bbox.y - _consts.PADDING, 0);

  const width = () => Math.min(props.bbox.width + _consts.PADDING * 2, window.innerWidth);

  const height = () => Math.min(props.bbox.height + _consts.PADDING * 2, window.innerHeight);

  return (() => {
    const _el$3 = _tmpl$2.cloneNode(true),
          _el$4 = _el$3.firstChild,
          _el$5 = _el$4.firstChild;

    _el$3.style.setProperty("position", "fixed");

    _el$3.style.setProperty("border", "2px solid " + _consts.baseColor);

    (0, _web.insert)(_el$5, (() => {
      const _c$ = (0, _web.memo)(() => !!(0, _hasExperimentalFeatures.hasExperimentalFeatures)(), true);

      return () => _c$() ? (() => {
        const _el$6 = _tmpl$3.cloneNode(true);

        _el$6.$$click = () => {
          props.showTreeFromElement(props.element);
        };

        (0, _web.setAttribute)(_el$6, "target", _consts.HREF_TARGET);
        return _el$6;
      })() : null;
    })(), null);
    (0, _web.insert)(_el$5, (0, _web.createComponent)(_solidJs.For, {
      get each() {
        return props.labels;
      },

      children: (label, i) => (() => {
        const _el$7 = _tmpl$4.cloneNode(true);

        _el$7.$$click = () => {
          console.log("click", label);
          (0, _trackClickStats.trackClickStats)();
          (0, _goTo.goTo)(label.link);
        };

        (0, _web.setAttribute)(_el$7, "target", _consts.HREF_TARGET);
        (0, _web.insert)(_el$7, () => label.label);
        (0, _web.effect)(() => (0, _web.setAttribute)(_el$7, "href", label.link));
        return _el$7;
      })()
    }), null);
    (0, _web.effect)(_p$ => {
      const _v$6 = left() + "px",
            _v$7 = top() + "px",
            _v$8 = width() + "px",
            _v$9 = height() + "px",
            _v$10 = left() === 0 || top() === 0 ? "0" : "8px",
            _v$11 = left() + width() === window.innerWidth || top() === 0 ? "0" : "8px",
            _v$12 = left() === 0 || top() + height() === window.innerHeight ? "0" : "8px",
            _v$13 = left() + width() === window.innerWidth || top() + height() === window.innerHeight ? "0" : "8px",
            _v$14 = {
        position: "absolute",
        display: "flex",
        "justify-content": "center",
        bottom: isBelow() ? isInside() ? "2px" : "-28px" : undefined,
        top: isBelow() ? undefined : isInside() ? "2px" : "-28px",
        left: "0px",
        width: "100%",
        "pointer-events": "auto",
        cursor: "pointer",
        ...(isBelow() ? {
          "border-bottom-left-radius": "100%",
          "border-bottom-right-radius": "100%"
        } : {
          "border-top-left-radius": "100%",
          "border-top-right-radius": "100%"
        })
      },
            _v$15 = isBelow() ? "10px 10px 2px 10px" : "2px 10px 10px 10px";

      _v$6 !== _p$._v$6 && _el$3.style.setProperty("left", _p$._v$6 = _v$6);
      _v$7 !== _p$._v$7 && _el$3.style.setProperty("top", _p$._v$7 = _v$7);
      _v$8 !== _p$._v$8 && _el$3.style.setProperty("width", _p$._v$8 = _v$8);
      _v$9 !== _p$._v$9 && _el$3.style.setProperty("height", _p$._v$9 = _v$9);
      _v$10 !== _p$._v$10 && _el$3.style.setProperty("border-top-left-radius", _p$._v$10 = _v$10);
      _v$11 !== _p$._v$11 && _el$3.style.setProperty("border-top-right-radius", _p$._v$11 = _v$11);
      _v$12 !== _p$._v$12 && _el$3.style.setProperty("border-bottom-left-radius", _p$._v$12 = _v$12);
      _v$13 !== _p$._v$13 && _el$3.style.setProperty("border-bottom-right-radius", _p$._v$13 = _v$13);
      _p$._v$14 = (0, _web.style)(_el$4, _v$14, _p$._v$14);
      _v$15 !== _p$._v$15 && _el$5.style.setProperty("padding", _p$._v$15 = _v$15);
      return _p$;
    }, {
      _v$6: undefined,
      _v$7: undefined,
      _v$8: undefined,
      _v$9: undefined,
      _v$10: undefined,
      _v$11: undefined,
      _v$12: undefined,
      _v$13: undefined,
      _v$14: undefined,
      _v$15: undefined
    });
    return _el$3;
  })();
}

(0, _web.delegateEvents)(["click"]);