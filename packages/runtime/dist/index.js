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
var linkColor = "rgb(56 189 248)";
var linkColorHover = "rgb(125 211 252)";
var PADDING = 6;
var fontFamily = "Helvetica, sans-serif, Arial";
// @ts-ignore
var currentElementRef = null;
var isMac = typeof navigator !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0;
var altTitle = isMac ? "⌥ Option" : "Alt";
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
var linkTemplate = function () { return allTargets[linkTypeOrTemplate]; };
var linkTemplateUrl = function () {
    var l = linkTemplate();
    return l ? l.url : linkTypeOrTemplate;
};
var modeInCookies = getCookie("LOCATORJS");
var defaultMode = "options";
function getMode() {
    return modeInCookies || defaultMode;
}
function setMode(newMode) {
    setCookie("LOCATORJS", newMode);
    modeInCookies = newMode;
}
function setTemplate(lOrTemplate) {
    setCookie("LOCATOR_CUSTOM_LINK", lOrTemplate);
    linkTypeOrTemplate = lOrTemplate;
}
if (typeof window !== "undefined") {
    document.addEventListener("keyup", globalKeyUpListener);
    var locatorDisabled = getMode() === "disabled";
    if (!locatorDisabled) {
        window.addEventListener("load", function () {
            init(getMode());
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
        var firstKey = Object.keys(allTargets)[0];
        if (!firstKey) {
            throw new Error("no targets found");
        }
        linkTypeOrTemplate = firstKey;
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
    return evalTemplate(linkTemplateUrl(), params);
}
function rerenderLayer(found, isAltKey) {
    var el = document.getElementById("locatorjs-layer");
    if (!el) {
        // in cases it's destroyed in the meantime
        return;
    }
    if (getMode() === "hidden" && !isAltKey) {
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
    if (found.dataset &&
        (found.dataset.locatorjsId || found.dataset.locatorjsStyled)) {
        var labels = [
            found.dataset.locatorjsId
                ? getDataForDataId(found.dataset.locatorjsId)
                : null,
            found.dataset.locatorjsStyled
                ? getDataForDataId(found.dataset.locatorjsStyled)
                : null,
        ].filter(nonNullable);
        if (labels.length === 0) {
            return;
        }
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
        var labelsSection = document.createElement("div");
        labelsSection.id = "locatorjs-labels-section";
        labelsSection.style.position = "absolute";
        labelsSection.style.display = "flex";
        labelsSection.style.justifyContent = "center";
        if (isReversed) {
            labelsSection.style.bottom = "-28px";
        }
        else {
            labelsSection.style.top = "-28px";
        }
        labelsSection.style.left = "0px";
        labelsSection.style.width = "100%";
        // Uncomment when need to debug
        // labelsSection.style.backgroundColor = "rgba(0, 255, 0, 0.5)";
        labelsSection.style.pointerEvents = "auto";
        if (isReversed) {
            labelsSection.style.borderBottomLeftRadius = "100%";
            labelsSection.style.borderBottomRightRadius = "100%";
        }
        else {
            labelsSection.style.borderTopLeftRadius = "100%";
            labelsSection.style.borderTopRightRadius = "100%";
        }
        rect.appendChild(labelsSection);
        var labelWrapper_1 = document.createElement("div");
        labelWrapper_1.id = "locatorjs-labels-wrapper";
        labelWrapper_1.style.padding = isReversed
            ? "10px 10px 2px 10px"
            : "2px 10px 10px 10px";
        labelsSection.appendChild(labelWrapper_1);
        labels.forEach(function (_a) {
            var fileData = _a.fileData, expData = _a.expData;
            var label = document.createElement("a");
            label.className = "locatorjs-label";
            label.href = buidLink(fileData.filePath, fileData.projectPath, expData.loc);
            if (expData.type === "jsx") {
                label.innerText =
                    (expData.wrappingComponent ? "".concat(expData.wrappingComponent, ": ") : "") +
                        expData.name;
            }
            else {
                label.innerText = "".concat(expData.htmlTag ? "styled.".concat(expData.htmlTag) : "styled").concat(expData.name ? ": ".concat(expData.name) : "");
            }
            label.onclick = function (e) {
                var link = buidLink(fileData.filePath, fileData.projectPath, expData.loc);
                window.open(link);
            };
            labelWrapper_1.appendChild(label);
        });
        el.innerHTML = "";
        el.appendChild(rect);
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
        if (target.className == "locatorjs-label" ||
            target.id == "locatorjs-labels-section") {
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
        if (getMode() === "hidden") {
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
        if (!fileData) {
            return;
        }
        var expData = fileData.expressions[Number(id)];
        if (!expData) {
            return;
        }
        var link = buidLink(fileData.filePath, fileData.projectPath, expData.loc);
        e.preventDefault();
        e.stopPropagation();
        window.open(link);
        //   window.open(link, "_blank");
    }
}
// function hideOptionsHandler() {
//   hideOptions();
//   setMode("hidden");
//   // showMinimal();
// }
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
function init(mode) {
    if (document.getElementById("locatorjs-layer")) {
        // already initialized
        return;
    }
    // add style tag to head
    var style = document.createElement("style");
    style.id = "locatorjs-style";
    style.innerHTML = "\n      #locatorjs-layer * {\n        box-sizing: border-box;\n      }\n      .locatorjs-label {\n        cursor: pointer;\n        background-color: ".concat(baseColor, ";\n        display: block;\n        color: #fff;\n        font-size: 12px;\n        font-weight: bold;\n        text-align: center;\n        padding: 2px 6px;\n        border-radius: 4px;\n        font-family: ").concat(fontFamily, ";\n        white-space: nowrap;\n        text-decoration: none !important;\n        line-height: 18px;\n      }\n      .locatorjs-label:hover {\n        background-color: ").concat(hoverColor, ";\n        color: #fff;\n        text-decoration: none;\n      }\n      #locatorjs-labels-section {\n      }\n      #locatorjs-labels-wrapper {\n        display: flex;\n        gap: 8px;\n      }\n      #locatorjs-options {\n        max-width: 100vw;\n        position: fixed;\n        bottom: 18px;\n        left: 18px;\n        background-color: #333;\n        border-radius: 12px;\n        font-size: 14px;\n        pointer-events: auto;\n        z-index: 100000;\n        padding: 16px 20px;\n        color: #eee;\n        line-height: 1.3em;\n        font-family: ").concat(fontFamily, ";\n        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);\n      }\n      #locatorjs-options a {\n        color: ").concat(linkColor, ";\n        text-decoration: underline;\n      }\n      #locatorjs-options a:hover {\n        color: ").concat(linkColorHover, ";\n        text-decoration: underline;\n      }\n      #locatorjs-minimal a {\n        color: #fff;\n        text-decoration: none;\n      }\n      #locatorjs-minimal a:hover {\n        color: #ccc;\n        text-decoration: none;\n      }\n      #locatorjs-options-close {\n        cursor: pointer;\n        color: #aaa;\n      }\n      #locatorjs-options-close:hover {\n          color: #eee\n      }\n      #locatorjs-options .locatorjs-editors-options {\n        display: flex;\n        margin: 4px 0px;\n      } \n      #locatorjs-options .locatorjs-option {\n        cursor: pointer;\n        padding: 4px 10px;\n        margin-right: 4px;\n        display: flex;\n        align-items: center;\n        gap: 6px;\n      }\n      #locatorjs-options .locatorjs-custom-template-input {\n        background-color: transparent;\n        border-radius: 6px;\n        margin: 4px 0px;\n        padding: 4px 10px;\n        border: 1px solid #555;\n        color: #eee;\n        width: 400px;\n      }\n      #locatorjs-minimal-to-hide, #locatorjs-minimal-to-options {\n        cursor: pointer;\n      }\n      #locatorjs-minimal-to-hide:hover, #locatorjs-minimal-to-options:hover {\n        text-decoration: underline;\n      }\n      #locatorjs-options .locatorjs-key {\n        padding: 2px 4px;\n        border-radius: 4px;\n        border: 1px solid #555;\n        margin: 2px;\n      }\n      #locatorjs-options .locatorjs-line {\n        padding: 4px 0px;\n      }\n      @media (max-width: 600px) {\n        #locatorjs-options {\n          width: 100vw;\n          bottom: 0px;\n          left: 0px;\n          border-radius: 12px 12px 0px 0px;\n        }\n      }\n    ");
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
    if (mode === "minimal") {
        showMinimal();
    }
    if (mode === "options") {
        showOptions();
    }
}
function showOptions() {
    var modal = document.createElement("div");
    modal.setAttribute("id", "locatorjs-options");
    var modalHeader = document.createElement("div");
    css(modalHeader, {
        padding: "0px",
        fontWeight: "bold",
        fontSize: "18px",
        marginBottom: "6px"
    });
    modalHeader.innerHTML = "LocatorJS enabled";
    modal.appendChild(modalHeader);
    var controls = document.createElement("div");
    controls.style.color = "#aaa";
    controls.innerHTML = "\n    <div>\n      <div class=\"locatorjs-line\"><b>Press and hold <span class=\"locatorjs-key\">".concat(altTitle, "</span>:</b> make boxes clickable on full surface</div>\n      <div class=\"locatorjs-line\"><b><span class=\"locatorjs-key\">").concat(altTitle, "</span> + <span class=\"locatorjs-key\">D</span>:</b> hide/show LocatorJS panel</div>\n      <div class=\"locatorjs-line\">\n        <a href=\"").concat(repoLink, "\">more info</a>\n      </div>\n    </div>");
    modal.appendChild(controls);
    var selector = document.createElement("div");
    selector.style.marginTop = "10px";
    // TODO print targets from their definition object
    selector.innerHTML = "\n    <b>Choose your editor: </b>\n    <div class=\"locatorjs-editors-options\">\n      ".concat(Object.entries(allTargets)
        .map(function (_a) {
        var key = _a[0], target = _a[1];
        return "<label class=\"locatorjs-option\"><input type=\"radio\" name=\"locatorjs-option\" value=\"".concat(key, "\" /> ").concat(target.label, "</label>");
    })
        .join("\n"), "\n      <label class=\"locatorjs-option\"><input type=\"radio\" name=\"locatorjs-option\" value=\"other\" /> Other</label>\n    </div>\n    <input class=\"locatorjs-custom-template-input\" type=\"text\" value=\"").concat(linkTemplateUrl(), "\" />\n    ");
    modal.appendChild(selector);
    var input = modal.querySelector(".locatorjs-custom-template-input");
    input.style.display = "none";
    // locatorjs-options should be clickable
    var options = modal.querySelectorAll(".locatorjs-editors-options input");
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
                input.value = linkTemplateUrl();
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
    closeButton.addEventListener("click", goToHiddenHandler);
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
        backgroundColor: "#333",
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
    alert("LocatorJS will be now hidden.\n\nPress and hold ".concat(altTitle, " so start selecting in hidden mode.\n").concat(altTitle, "+D: To show UI"));
}
function getDataForDataId(dataId) {
    var _a = parseDataId(dataId), fileFullPath = _a[0], id = _a[1];
    var fileData = dataByFilename[fileFullPath];
    if (!fileData) {
        return;
    }
    var expData = fileData.expressions[Number(id)];
    if (!expData) {
        return;
    }
    return { fileData: fileData, expData: expData };
}
function nonNullable(value) {
    return value !== null && value !== undefined;
}
exports["default"] = nonNullable;
