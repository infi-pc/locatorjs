"use strict";
exports.__esModule = true;
exports.register = void 0;
var dataByFilename = {};
var baseColor = "#e90139";
var hoverColor = "#C70139";
var PADDING = 6;
var currentElementRef = null;
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
function buidLink(filePath, loc) {
    return "vscode://file" + filePath + ":" + loc.start.line + ":" + (loc.start.column + 1);
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
        //   window.open(link, "_blank");
    }
}
function init(showOnboarding) {
    if (document.getElementById("locatorjs-layer")) {
        // already initialized
        return;
    }
    // add style tag to head
    var style = document.createElement("style");
    style.innerHTML = "\n        #locatorjs-label {\n            cursor: pointer;\n            background-color: " + baseColor + ";\n        }\n        #locatorjs-label:hover {\n            background-color: " + hoverColor + ";\n        }\n    ";
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
        modal.style.top = "10px";
        modal.style.left = "10px";
        // modal.style.width = "400px";
        modal.style.backgroundColor = "#fff";
        modal.style.borderRadius = "8px";
        modal.style.boxShadow = "0px 0px 10px rgba(0, 0, 0, 0.5)";
        modal.style.pointerEvents = "auto";
        modal.style.zIndex = "10000";
        modal.style.padding = "12px 20px";
        var modalHeader = document.createElement("div");
        modalHeader.style.padding = "0px";
        modalHeader.textContent = "Locator enabled";
        modal.appendChild(modalHeader);
        var modalBody = document.createElement("div");
        modalBody.style.padding = "0px";
        modalBody.textContent = "Disable/enable locator by alt-d";
        modal.appendChild(modalBody);
        var note = document.createElement("div");
        note.style.padding = "0px";
        note.textContent = "Hint: press alt to make whole component box clickable.";
        modal.appendChild(note);
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
    if (document.body.style.cursor === "pointer") {
        document.body.style.cursor = "";
    }
}
function getCookie(name) {
    var match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    if (match)
        return match[2];
}
function setCookie(name, value) {
    document.cookie = name + "=" + (value || "") + "; path=/";
}
