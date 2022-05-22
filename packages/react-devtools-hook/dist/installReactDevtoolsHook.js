"use strict";
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
exports.__esModule = true;
exports.installReactDevtoolsHook = exports.MARKER = void 0;
var createReactDevtoolsHook_1 = require("./createReactDevtoolsHook");
exports.MARKER = Symbol();
function installReactDevtoolsHook() {
  var existingHook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (window.hasOwnProperty("__REACT_DEVTOOLS_GLOBAL_HOOK__")) {
    if (existingHook[exports.MARKER] === exports.MARKER) {
      // console.log("already installed!!!!!");
      return existingHook;
    }
  }
  var hook = (0, createReactDevtoolsHook_1.createReactDevtoolsHook)(
    __assign({}, existingHook)
  );
  if (existingHook) {
    existingHook[exports.MARKER] = exports.MARKER;
    for (var _i = 0, _a = Object.entries(hook); _i < _a.length; _i++) {
      var _b = _a[_i],
        key = _b[0],
        value = _b[1];
      if (typeof value === "function") {
        // @ts-ignore
        delete existingHook[key];
        // @ts-ignore
        existingHook[key] = value;
      }
    }
  } else {
    Object.defineProperty(window, "__REACT_DEVTOOLS_GLOBAL_HOOK__", {
      configurable: false,
      enumerable: false,
      get: function () {
        return hook;
      },
    });
  }
  return window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
}
exports.installReactDevtoolsHook = installReactDevtoolsHook;
