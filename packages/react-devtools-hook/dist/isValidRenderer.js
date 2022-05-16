"use strict";
exports.__esModule = true;
exports.isValidRenderer = exports.BUNDLE_TYPE_DEV = exports.BUNDLE_TYPE_PROD = exports.MIN_SUPPORTED_VERSION = void 0;
var semver_1 = require("semver");
exports.MIN_SUPPORTED_VERSION = "16.9.0";
exports.BUNDLE_TYPE_PROD = 0;
exports.BUNDLE_TYPE_DEV = 1;
function isValidRenderer(_a) {
    var rendererPackageName = _a.rendererPackageName, version = _a.version, bundleType = _a.bundleType;
    if (rendererPackageName !== "react-dom" ||
        typeof version !== "string" ||
        !/^\d+\.\d+\.\d+(-\S+)?$/.test(version) ||
        !(0, semver_1.gte)(version, exports.MIN_SUPPORTED_VERSION)) {
        console.warn("[locator-js] Unsupported React renderer (only react-dom v".concat(exports.MIN_SUPPORTED_VERSION, "+ is supported)"), {
            renderer: rendererPackageName || "unknown",
            version: version || "unknown"
        });
        return false;
    }
    if (bundleType !== exports.BUNDLE_TYPE_DEV) {
        console.warn("[locator-js] Unsupported React renderer, only bundle type ".concat(exports.BUNDLE_TYPE_DEV, " (development) is supported but ").concat(bundleType, " (").concat(bundleType === exports.BUNDLE_TYPE_PROD ? "production" : "unknown", ") is found"));
        return false;
    }
    return true;
}
exports.isValidRenderer = isValidRenderer;
