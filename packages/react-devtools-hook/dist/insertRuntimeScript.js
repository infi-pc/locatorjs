"use strict";
exports.__esModule = true;
exports.insertRuntimeScript = void 0;
var isValidRenderer_1 = require("./isValidRenderer");
function insertRuntimeScript() {
    var locatorClientUrl = document.documentElement.dataset.locatorClientUrl;
    window.setTimeout(function () {
        if (!locatorClientUrl) {
            throw new Error("Locator client url not found");
        }
        var renderers = getValidRenderers();
        if (renderers.length) {
            insertScript(locatorClientUrl);
        }
        else {
            // console.log('[locatorjs]: No renderers found');
        }
    }, 1000);
    function insertScript(locatorClientUrl) {
        var script = document.createElement("script");
        script.src = locatorClientUrl;
        if (document.head) {
            document.head.appendChild(script);
            if (script.parentNode) {
                script.parentNode.removeChild(script);
                // TODO maybe add back
                // delete document.documentElement.dataset.locatorClientUrl;
            }
        }
    }
    function getValidRenderers() {
        var _a;
        var renderersMap = (_a = window.__REACT_DEVTOOLS_GLOBAL_HOOK__) === null || _a === void 0 ? void 0 : _a.renderers;
        if (renderersMap) {
            return Array.from(renderersMap.values()).filter(function (renderer) {
                return (0, isValidRenderer_1.isValidRenderer)(renderer);
            });
        }
        return [];
    }
}
exports.insertRuntimeScript = insertRuntimeScript;
