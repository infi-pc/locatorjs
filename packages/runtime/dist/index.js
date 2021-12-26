"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.register = exports.setup = void 0;
var dataByFilename = {};
var baseColor = "#e90139";
var hoverColor = "#C70139";
var PADDING = 6;
var fontFamily = "Helvetica, sans-serif, Arial";
// @ts-ignore
var currentElementRef = null;
var isMac = typeof navigator !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0;
var altTitle = isMac ? "Option" : "Alt";
var allTargets = {
    vscode: {
        url: "vscode://file${projectPath}${filePath}:${line}:${column}",
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
var repoLink = "https://github.com/infi-pc/locatorjs";
var linkTypeOrTemplate = getCookie("LOCATOR_CUSTOM_LINK") || "vscode";
var linkTemplate = allTargets[linkTypeOrTemplate];
var linkTemplateUrl = linkTemplate
    ? linkTemplate.url
    : linkTypeOrTemplate;
var modeInCookies = getCookie("LOCATORJS");
var defaultMode = "options";
function setMode(newMode) {
    setCookie("LOCATORJS", newMode);
    modeInCookies = newMode;
}
function setTemplate(lOrTemplate) {
    setCookie("LOCATOR_CUSTOM_LINK", lOrTemplate);
    linkTypeOrTemplate = lOrTemplate;
    var linkTemplate = allTargets[linkTypeOrTemplate];
    linkTemplateUrl = linkTemplate ? linkTemplate.url : linkTypeOrTemplate;
}
if (typeof window !== "undefined") {
    document.addEventListener("keyup", globalKeyUpListener);
    var locatorDisabled = modeInCookies === "disabled";
    if (!locatorDisabled) {
        window.addEventListener("load", function () {
            init(modeInCookies || defaultMode);
        });
    }
}
function setup(props) {
    if (props.defaultMode) {
        defaultMode = props.defaultMode;
    }
    if (props.targets) {
        allTargets = Object.fromEntries(Object.entries(props.targets).map(function (_a) {
            var key = _a[0], target = _a[1];
            return typeof target === "string"
                ? [key, { url: target, label: key }]
                : [key, target];
        }));
    }
}
exports.setup = setup;
function register(input) {
    dataByFilename[input.projectPath + input.filePath] = input;
}
exports.register = register;
function evalTemplate(str, params) {
    var names = Object.keys(params);
    var vals = Object.values(params);
    // @ts-ignore
    return new (Function.bind.apply(Function, __spreadArray(__spreadArray([void 0], names, false), ["return `".concat(str, "`;")], false)))().apply(void 0, vals);
}
function buidLink(filePath, projectPath, loc) {
    var params = {
        filePath: filePath,
        projectPath: projectPath,
        line: loc.start.line,
        column: loc.start.column + 1
    };
    return evalTemplate(linkTemplateUrl, params);
}
function rerenderLayer(found, isAltKey) {
    var el = document.getElementById("locatorjs-layer");
    if (!el) {
        // in cases it's destroyed in the meantime
        return;
    }
    if (modeInCookies === "hidden" && !isAltKey) {
        el.innerHTML = "";
        document.body.style.cursor = "";
        return;
    }
    if (isAltKey) {
        document.body.style.cursor = "pointer";
    }
    else {
        document.body.style.cursor = "";
    }
    if (found.dataset && found.dataset.locatorjsId) {
        var _a = parseDataId(found.dataset.locatorjsId), fileFullPath = _a[0], id = _a[1];
        var fileData = dataByFilename[fileFullPath];
        var expData = fileData.expressions[id];
        if (expData) {
            var bbox = found.getBoundingClientRect();
            var rect = document.createElement("div");
            css(rect, {
                position: "absolute",
                left: bbox.x - PADDING + "px",
                top: bbox.y - PADDING + "px",
                width: bbox.width + PADDING * 2 + "px",
                height: bbox.height + PADDING * 2 + "px",
                border: "2px solid " + baseColor,
                borderRadius: "8px"
            });
            if (isAltKey) {
                rect.style.backgroundColor = "rgba(255, 0, 0, 0.1)";
            }
            var isReversed = bbox.y < 30;
            var topPart = document.createElement("div");
            topPart.style.position = "absolute";
            topPart.style.display = "flex";
            topPart.style.justifyContent = "center";
            if (isReversed) {
                topPart.style.bottom = "-26px";
            }
            else {
                topPart.style.top = "-30px";
            }
            topPart.style.left = "0px";
            topPart.style.width = "100%";
            rect.appendChild(topPart);
            var labelWrapper = document.createElement("div");
            labelWrapper.style.padding = isReversed
                ? "10px 10px 2px 10px"
                : "2px 10px 10px 10px";
            // labelWrapper.style.backgroundColor = "#00ff00";
            labelWrapper.style.pointerEvents = "auto";
            labelWrapper.id = "locatorjs-label-wrapper";
            topPart.appendChild(labelWrapper);
            var label = document.createElement("a");
            label.href = buidLink(fileData.filePath, fileData.projectPath, expData.loc);
            // label.style.backgroundColor = "#ff0000";
            css(label, {
                color: "#fff",
                fontSize: "12px",
                fontWeight: "bold",
                textAlign: "center",
                padding: "2px 6px",
                borderRadius: "4px",
                fontFamily: fontFamily,
                whiteSpace: "nowrap"
            });
            label.innerText =
                (expData.wrappingComponent ? "".concat(expData.wrappingComponent, ": ") : "") +
                    expData.name;
            label.id = "locatorjs-label";
            labelWrapper.appendChild(label);
            el.innerHTML = "";
            el.appendChild(rect);
        }
    }
}
function parseDataId(dataId) {
    var _a = dataId.split("::"), fileFullPath = _a[0], id = _a[1];
    if (!fileFullPath || !id) {
        throw new Error("locatorjsId is malformed");
    }
    return [fileFullPath, id];
}
function scrollListener() {
    // hide layers when scrolling
    var el = document.getElementById("locatorjs-layer");
    if (!el) {
        throw new Error("no layer found");
    }
    currentElementRef = null;
    el.innerHTML = "";
}
function mouseOverListener(e) {
    var target = e.target;
    if (target && target instanceof HTMLElement) {
        if (target.id == "locatorjs-label" ||
            target.id == "locatorjs-label-wrapper") {
            return;
        }
        var found = target.closest("[data-locatorjs-id]");
        if (found && found instanceof HTMLElement) {
            // @ts-ignore
            currentElementRef = new WeakRef(found);
            rerenderLayer(found, e.altKey);
        }
    }
}
function keyDownListener(e) {
    if (currentElementRef) {
        var el = currentElementRef.deref();
        if (el) {
            rerenderLayer(el, e.altKey);
        }
    }
}
function keyUpListener(e) {
    if (currentElementRef) {
        var el = currentElementRef.deref();
        if (el) {
            rerenderLayer(el, e.altKey);
        }
    }
}
function globalKeyUpListener(e) {
    if (e.code === "KeyD" && e.altKey) {
        if (modeInCookies === "hidden") {
            destroy();
            setMode("minimal");
            init("minimal");
        }
        else {
            destroy();
            setMode("hidden");
            init("hidden");
        }
        return;
    }
}
function clickListener(e) {
    if (!e.altKey) {
        return;
    }
    var target = e.target;
    if (target && target instanceof HTMLElement) {
        var found = target.closest("[data-locatorjs-id]");
        if (!found || !found.dataset || !found.dataset.locatorjsId) {
            return;
        }
        var _a = parseDataId(found.dataset.locatorjsId), filePath = _a[0], id = _a[1];
        var fileData = dataByFilename[filePath];
        var expData = fileData.expressions[Number(id)];
        var link = buidLink(fileData.filePath, fileData.projectPath, expData.loc);
        e.preventDefault();
        e.stopPropagation();
        window.open(link);
        //   window.open(link, "_blank");
    }
}
function hideOptionsHandler() {
    hideOptions();
    setMode("minimal");
    showMinimal();
}
function showOptionsHandler() {
    hideMinimal();
    setMode("options");
    showOptions();
}
function hideOptions() {
    var optionsEl = document.getElementById("locatorjs-options");
    if (optionsEl) {
        optionsEl.remove();
    }
}
function init(locatorJSMode) {
    if (document.getElementById("locatorjs-layer")) {
        // already initialized
        return;
    }
    // add style tag to head
    var style = document.createElement("style");
    style.id = "locatorjs-style";
    style.innerHTML = "\n      #locatorjs-label {\n          cursor: pointer;\n          background-color: ".concat(baseColor, ";\n      }\n      #locatorjs-label:hover {\n          background-color: ").concat(hoverColor, ";\n      }\n      #locatorjs-options-close {\n          cursor: pointer;\n          color: #baa;\n      }\n      #locatorjs-options-close:hover {\n          color: #fee\n      }\n      .locatorjs-options {\n        display: flex;\n        margin: 4px 0px;\n      } \n      .locatorjs-option {\n        cursor: pointer;\n        padding: 4px 10px;\n        margin-right: 4px;\n        display: flex;\n        align-items: center;\n        gap: 6px;\n      }\n      .locatorjs-custom-template-input {\n        background-color: transparent;\n        border-radius: 6px;\n        margin: 4px 0px;\n        padding: 4px 10px;\n        border: 1px solid #555;\n        color: #fee;\n        width: 400px;\n      }\n      #locatorjs-minimal-to-hide, #locatorjs-minimal-to-options {\n        cursor: pointer;\n      }\n      #locatorjs-minimal-to-hide:hover, #locatorjs-minimal-to-options:hover {\n        text-decoration: underline;\n      }\n    ");
    document.head.appendChild(style);
    document.addEventListener("scroll", scrollListener);
    document.addEventListener("mouseover", mouseOverListener, { capture: true });
    document.addEventListener("keydown", keyDownListener);
    document.addEventListener("keyup", keyUpListener);
    document.addEventListener("click", clickListener, { capture: true });
    // add layer to body
    var layer = document.createElement("div");
    layer.setAttribute("id", "locatorjs-layer");
    // layer is full screen
    css(layer, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        zIndex: "9999",
        pointerEvents: "none"
    });
    document.body.appendChild(layer);
    if (locatorJSMode === "minimal") {
        showMinimal();
    }
    if (locatorJSMode === "options") {
        showOptions();
    }
}
function showOptions() {
    var modal = document.createElement("div");
    modal.setAttribute("id", "locatorjs-options");
    css(modal, {
        position: "fixed",
        bottom: "18px",
        left: "18px",
        backgroundColor: "#333",
        borderRadius: "12px",
        fontSize: "14px",
        border: "2px solid " + baseColor,
        pointerEvents: "auto",
        zIndex: "10000",
        padding: "16px 20px",
        color: "#fee",
        lineHeight: "1.3rem",
        fontFamily: fontFamily
    });
    var modalHeader = document.createElement("div");
    css(modalHeader, {
        padding: "0px",
        fontWeight: "bold",
        fontSize: "18px",
        marginBottom: "6px"
    });
    modalHeader.innerHTML = "<a href=\"".concat(repoLink, "\">LocatorJS enabled</a>");
    modal.appendChild(modalHeader);
    var controls = document.createElement("div");
    controls.style.color = "#baa";
    controls.innerHTML = "<div><b>".concat(altTitle, "+d:</b> enable/disable Locator<br /><b>Press and hold ").concat(altTitle, ":</b> make boxes clickable on full surface </div>");
    modal.appendChild(controls);
    var selector = document.createElement("div");
    selector.style.marginTop = "10px";
    // TODO print targets from their definition object
    selector.innerHTML = "\n    <b>Choose your editor: </b>\n    <div class=\"locatorjs-options\">\n      ".concat(Object.entries(allTargets).map(function (_a) {
        var key = _a[0], target = _a[1];
        return "<label class=\"locatorjs-option\"><input type=\"radio\" name=\"locatorjs-option\" value=\"".concat(key, "\" /> ").concat(target.label, "</label>");
    }).join("\n"), "\n      <label class=\"locatorjs-option\"><input type=\"radio\" name=\"locatorjs-option\" value=\"other\" /> Other</label>\n    </div>\n    <input class=\"locatorjs-custom-template-input\" type=\"text\" value=\"").concat(linkTemplateUrl, "\" />\n    ");
    modal.appendChild(selector);
    var input = modal.querySelector(".locatorjs-custom-template-input");
    input.style.display = "none";
    // locatorjs-options should be clickable
    var options = modal.querySelectorAll(".locatorjs-option input");
    options.forEach(function (option) {
        if (linkTypeOrTemplate === option.value) {
            option.checked = true;
        }
        option.addEventListener("change", function (e) {
            if (e.target.checked) {
                if (e.target.value === "other") {
                    input.style.display = "block";
                    input.focus();
                }
                else {
                    input.style.display = "none";
                }
                setTemplate(e.target.value === "other" ? input.value : e.target.value);
                input.value = linkTemplateUrl;
            }
        });
    });
    var closeButton = document.createElement("div");
    closeButton.id = "locatorjs-options-close";
    css(closeButton, {
        position: "absolute",
        top: "10px",
        right: "10px",
        padding: "0px"
    });
    closeButton.innerHTML = "<svg style=\"width:24px;height:24px\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" d=\"M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z\" /></svg>";
    closeButton.addEventListener("click", hideOptionsHandler);
    modal.appendChild(closeButton);
    document.body.appendChild(modal);
}
function showMinimal() {
    var minimal = document.createElement("div");
    minimal.setAttribute("id", "locatorjs-minimal");
    css(minimal, {
        position: "fixed",
        bottom: "18px",
        left: "18px",
        backgroundColor: baseColor,
        fontSize: "14px",
        borderRadius: "4px",
        padding: "2px 6px",
        color: "white",
        zIndex: "10000",
        fontFamily: fontFamily
    });
    minimal.innerHTML = "\n    <div><a href=\"".concat(repoLink, "\">LocatorJS</a>: <a id=\"locatorjs-minimal-to-options\">options</a> | <a id=\"locatorjs-minimal-to-hide\">hide</a></div>\n    ");
    var options = minimal.querySelector("#locatorjs-minimal-to-options");
    options.addEventListener("click", showOptionsHandler);
    var hide = minimal.querySelector("#locatorjs-minimal-to-hide");
    hide.addEventListener("click", goToHiddenHandler);
    document.body.appendChild(minimal);
}
function destroy() {
    var el = document.getElementById("locatorjs-layer");
    if (el) {
        document.removeEventListener("scroll", scrollListener);
        document.removeEventListener("mouseover", mouseOverListener, {
            capture: true
        });
        document.removeEventListener("keydown", keyDownListener);
        document.removeEventListener("keyup", keyUpListener);
        document.removeEventListener("click", clickListener);
        el.remove();
    }
    hideOptions();
    var styleEl = document.getElementById("locatorjs-style");
    if (styleEl) {
        styleEl.remove();
    }
    hideMinimal();
    if (document.body.style.cursor === "pointer") {
        document.body.style.cursor = "";
    }
}
function hideMinimal() {
    var minimalEl = document.getElementById("locatorjs-minimal");
    if (minimalEl) {
        minimalEl.remove();
    }
}
function getCookie(name) {
    if (typeof document === "undefined") {
        return;
    }
    var match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    if (match)
        return match[2];
}
function setCookie(name, value) {
    document.cookie = name + "=" + (value || "") + "; path=/";
}
function css(element, styles) {
    for (var _i = 0, _a = Object.keys(styles); _i < _a.length; _i++) {
        var key = _a[_i];
        // @ts-ignore
        element.style[key] = styles[key];
    }
}
function goToHiddenHandler() {
    setMode("hidden");
    destroy();
    init("hidden");
    alert("LocatorJS will be now hidden.\n\nPress and hold ".concat(altTitle, " so start selecting in hidden mode.\n").concat(altTitle, "+d: To show UI"));
}
