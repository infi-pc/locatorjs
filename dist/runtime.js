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
exports.register = void 0;
var dataByFilename = {};
var baseColor = "#e90139";
var hoverColor = "#C70139";
var PADDING = 6;
// @ts-ignore
var currentElementRef = null;
var isMac = typeof navigator !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0;
var altTitle = isMac ? "Option" : "Alt";
var linkTemplates = {
    vscode: "vscode://file${filePath}:${line}:${column}",
    webstorm: "webstorm://open?file=${filePath}&line=${line}&column=${column}",
    // sublime: "sublimetext://open?url=file://${filePath}&line=${line}&column=${column}",
    atom: "atom://core/open/file?filename=${filePath}&line=${line}&column=${column}"
};
var linkTypeOrTemplate = getCookie("LOCATOR_CUSTOM_LINK") || "vscode";
var linkTemplate = linkTemplates[linkTypeOrTemplate] || linkTypeOrTemplate;
function setTemplate(lOrTemplate) {
    setCookie("LOCATOR_CUSTOM_LINK", lOrTemplate);
    linkTypeOrTemplate = lOrTemplate;
    linkTemplate = linkTemplates[linkTypeOrTemplate] || linkTypeOrTemplate;
}
if (typeof window !== "undefined") {
    document.addEventListener("keyup", globalKeyUpListener);
    var locatorDisabledCookie = getCookie("LOCATOR_DISABLED");
    var locatorDisabled = locatorDisabledCookie === "true";
    if (!locatorDisabled) {
        init(!locatorDisabledCookie);
    }
}
function register(input) {
    dataByFilename[input.filePath] = input;
}
exports.register = register;
function evalTemplate(str, params) {
    var names = Object.keys(params);
    var vals = Object.values(params);
    return new (Function.bind.apply(Function, __spreadArray(__spreadArray([void 0], names, false), ["return `".concat(str, "`;")], false)))().apply(void 0, vals);
}
function buidLink(filePath, loc) {
    var params = {
        filePath: filePath,
        line: loc.start.line,
        column: loc.start.column + 1
    };
    return evalTemplate(linkTemplate, params);
}
function rerenderLayer(found, isAltKey) {
    var el = document.getElementById("locatorjs-layer");
    if (!el) {
        // in cases it's destroyed in the meantime
        return;
    }
    if (isAltKey) {
        document.body.style.cursor = "pointer";
    }
    else {
        document.body.style.cursor = "";
    }
    if (found.dataset && found.dataset.locatorjsId) {
        var _a = found.dataset.locatorjsId.split("::"), filePath = _a[0], id = _a[1];
        var data = dataByFilename[filePath];
        var expData = data.expressions[id];
        if (expData) {
            var bbox = found.getBoundingClientRect();
            var rect = document.createElement("div");
            rect.style.position = "absolute";
            rect.style.left = bbox.x - PADDING + "px";
            rect.style.top = bbox.y - PADDING + "px";
            rect.style.width = bbox.width + PADDING * 2 + "px";
            rect.style.height = bbox.height + PADDING * 2 + "px";
            rect.style.border = "2px solid " + baseColor;
            rect.style.borderRadius = "8px";
            if (isAltKey) {
                rect.style.backgroundColor = "rgba(255, 0, 0, 0.1)";
            }
            var topPart = document.createElement("div");
            topPart.style.position = "absolute";
            topPart.style.display = "flex";
            topPart.style.justifyContent = "center";
            topPart.style.top = "-30px";
            topPart.style.left = "0px";
            topPart.style.width = "100%";
            rect.appendChild(topPart);
            var labelWrapper = document.createElement("div");
            labelWrapper.style.padding = "2px 10px 10px 10px";
            // labelWrapper.style.backgroundColor = "#00ff00";
            labelWrapper.style.pointerEvents = "auto";
            labelWrapper.id = "locatorjs-label-wrapper";
            topPart.appendChild(labelWrapper);
            var label = document.createElement("a");
            label.href = buidLink(filePath, expData.loc);
            // label.style.backgroundColor = "#ff0000";
            label.style.color = "#fff";
            label.style.fontSize = "12px";
            label.style.fontWeight = "bold";
            label.style.textAlign = "center";
            label.style.padding = "2px 6px";
            label.style.borderRadius = "4px";
            label.style.fontFamily = "Helvetica, sans-serif, Arial";
            label.innerText = expData.name;
            label.id = "locatorjs-label";
            labelWrapper.appendChild(label);
            el.innerHTML = "";
            el.appendChild(rect);
            // document.body.childNodes = [rect]
        }
    }
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
        var el = document.getElementById("locatorjs-layer");
        if (el) {
            destroy();
            setCookie("LOCATOR_DISABLED", "true");
        }
        else {
            init(false);
            setCookie("LOCATOR_DISABLED", "false");
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
        console.log("TTT");
        var found = target.closest("[data-locatorjs-id]");
        if (!found || !found.dataset || !found.dataset.locatorjsId) {
            return;
        }
        var _a = found.dataset.locatorjsId.split("::"), filePath = _a[0], id = _a[1];
        var data = dataByFilename[filePath];
        console.log(data);
        console.log();
        var exp = data.expressions[Number(id)];
        // window.location.href =
        var link = buidLink(filePath, exp.loc);
        console.log(link);
        window.open(link);
        e.preventDefault();
        e.stopPropagation();
        //   window.open(link, "_blank");
    }
}
function hideOnboardingHandler() {
    var onboardingEl = document.getElementById("locatorjs-onboarding");
    if (onboardingEl) {
        onboardingEl.remove();
    }
    setCookie("LOCATOR_DISABLED", "false");
}
function init(showOnboarding) {
    if (document.getElementById("locatorjs-layer")) {
        // already initialized
        return;
    }
    // add style tag to head
    var style = document.createElement("style");
    style.id = "locatorjs-style";
    style.innerHTML = "\n        #locatorjs-label {\n            cursor: pointer;\n            background-color: ".concat(baseColor, ";\n        }\n        #locatorjs-label:hover {\n            background-color: ").concat(hoverColor, ";\n        }\n        #locatorjs-onboarding-close {\n            cursor: pointer;\n            color: #baa;\n        }\n        #locatorjs-onboarding-close:hover {\n            color: #fee\n        }\n        .locatorjs-options {\n          display: flex;\n          margin: 4px 0px;\n        } \n        .locatorjs-option {\n          cursor: pointer;\n          padding: 4px 10px;\n          margin-right: 4px;\n          display: flex;\n          align-items: center;\n          gap: 6px;\n        }\n      .locatorjs-custom-template-input {\n        background-color: transparent;\n        border-radius: 6px;\n        margin: 4px 0px;\n        padding: 4px 10px;\n        border: 1px solid #555;\n        color: #fee;\n        width: 400px;\n      }\n    ");
    document.head.appendChild(style);
    document.addEventListener("scroll", scrollListener);
    document.addEventListener("mouseover", mouseOverListener, { capture: true });
    document.addEventListener("keydown", keyDownListener);
    document.addEventListener("keyup", keyUpListener);
    document.addEventListener("click", clickListener);
    // add layer to body
    var layer = document.createElement("div");
    layer.setAttribute("id", "locatorjs-layer");
    // layer is full screen
    layer.style.position = "fixed";
    layer.style.top = "0";
    layer.style.left = "0";
    layer.style.width = "100%";
    layer.style.height = "100%";
    layer.style.zIndex = "9999";
    layer.style.pointerEvents = "none";
    document.body.appendChild(layer);
    if (showOnboarding) {
        // add popover to the layer
        var modal = document.createElement("div");
        modal.setAttribute("id", "locatorjs-onboarding");
        modal.style.position = "absolute";
        modal.style.top = "18px";
        modal.style.left = "18px";
        // modal.style.width = "400px";
        modal.style.backgroundColor = "#333";
        modal.style.borderRadius = "12px";
        modal.style.fontSize = "14px";
        // modal.style.boxShadow = `1px 1px 6px ${baseColor}`;
        modal.style.border = "2px solid " + baseColor;
        modal.style.pointerEvents = "auto";
        modal.style.zIndex = "10000";
        modal.style.padding = "16px 20px";
        modal.style.color = "#fee";
        modal.style.lineHeight = "1.3rem";
        var modalHeader = document.createElement("div");
        modalHeader.style.padding = "0px";
        modalHeader.style.fontWeight = "bold";
        modalHeader.style.fontSize = "18px";
        modalHeader.style.marginBottom = "6px";
        modalHeader.textContent = "LocatorJS enabled";
        modal.appendChild(modalHeader);
        var modalBody = document.createElement("div");
        modalBody.innerHTML = "Disable/enable locator by <b>".concat(altTitle, "-d</b>");
        modal.appendChild(modalBody);
        var note = document.createElement("div");
        note.style.color = "#baa";
        note.innerHTML = "Hint: press and hold <b>".concat(altTitle, "</b> to make whole component box clickable.");
        modal.appendChild(note);
        var selector = document.createElement("div");
        // selector.style.padding = "0px";
        // selector.style.color = "#baa";
        selector.innerHTML = "\n    <div class=\"locatorjs-options\">\n      <label class=\"locatorjs-option\"><input type=\"radio\" name=\"locatorjs-option\" value=\"vscode\" /> VSCode</label>\n      <label class=\"locatorjs-option\"><input type=\"radio\" name=\"locatorjs-option\" value=\"webstorm\" /> Webstorm</label>\n      <label class=\"locatorjs-option\"><input type=\"radio\" name=\"locatorjs-option\" value=\"atom\" /> Atom</label>\n      <label class=\"locatorjs-option\"><input type=\"radio\" name=\"locatorjs-option\" value=\"other\" /> Other</label>\n    </div>\n    <input class=\"locatorjs-custom-template-input\" type=\"text\" value=\"".concat(linkTemplate, "\" />\n    ");
        modal.appendChild(selector);
        var input_1 = modal.querySelector(".locatorjs-custom-template-input");
        input_1.style.display = "none";
        // locatorjs-options should be clickable
        var options = modal.querySelectorAll(".locatorjs-option input");
        options.forEach(function (option) {
            if (linkTypeOrTemplate === option.value) {
                option.checked = true;
            }
            option.addEventListener("change", function (e) {
                if (e.target.checked) {
                    if (e.target.value === "other") {
                        input_1.style.display = "block";
                        input_1.focus();
                    }
                    else {
                        input_1.style.display = "none";
                    }
                    setTemplate(e.target.value === "other" ? input_1.value : e.target.value);
                    input_1.value = linkTemplate;
                }
            });
        });
        var closeButton = document.createElement("div");
        closeButton.id = "locatorjs-onboarding-close";
        closeButton.style.position = "absolute";
        closeButton.style.top = "10px";
        closeButton.style.right = "10px";
        closeButton.style.padding = "0px";
        closeButton.innerHTML = "<svg style=\"width:24px;height:24px\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" d=\"M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z\" /></svg>";
        closeButton.addEventListener("click", hideOnboardingHandler);
        modal.appendChild(closeButton);
        document.body.appendChild(modal);
    }
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
    var onboardingEl = document.getElementById("locatorjs-onboarding");
    if (onboardingEl) {
        onboardingEl.remove();
    }
    var styleEl = document.getElementById("locatorjs-style");
    if (styleEl) {
        styleEl.remove();
    }
    if (document.body.style.cursor === "pointer") {
        document.body.style.cursor = "";
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
