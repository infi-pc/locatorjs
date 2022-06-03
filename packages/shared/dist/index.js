"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
exports.__esModule = true;
exports.getModifiersString = exports.getModifiersMap = exports.modifiersTitles = exports.metaTitle = exports.ctrlTitle = exports.shiftTitle = exports.altTitle = exports.isMac = exports.allTargets = void 0;
__exportStar(require("./types"), exports);
exports.allTargets = {
    vscode: {
        url: "vscode://file/${projectPath}${filePath}:${line}:${column}",
        label: "VSCode"
    },
    webstorm: {
        url: "webstorm://open?file=${projectPath}${filePath}&line=${line}&column=${column}",
        label: "WebStorm"
    },
    atom: {
        url: "atom://core/open/file?filename=${projectPath}${filePath}&line=${line}&column=${column}",
        label: "Atom"
    }
};
exports.isMac = 
// @ts-ignore
typeof navigator !== "undefined" &&
    // @ts-ignore
    navigator.platform.toUpperCase().indexOf("MAC") >= 0;
exports.altTitle = exports.isMac ? "⌥ Option" : "Alt";
exports.shiftTitle = exports.isMac ? "⇧ Shift" : "Shift";
exports.ctrlTitle = exports.isMac ? "⌃ Ctrl" : "Ctrl";
exports.metaTitle = exports.isMac ? "⌘ Command" : "Windows";
exports.modifiersTitles = {
    alt: exports.altTitle,
    ctrl: exports.ctrlTitle,
    meta: exports.metaTitle,
    shift: exports.shiftTitle
};
function getModifiersMap(modifiersString) {
    var mouseModifiersArray = modifiersString.split("+").filter(Boolean);
    var modifiersMap = {};
    mouseModifiersArray.forEach(function (modifier) {
        modifiersMap[modifier] = true;
    }, {});
    return modifiersMap;
}
exports.getModifiersMap = getModifiersMap;
function getModifiersString(modifiersMap) {
    var modifiersArray = Object.keys(modifiersMap);
    return modifiersArray.join("+");
}
exports.getModifiersString = getModifiersString;
