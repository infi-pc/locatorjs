"use strict";
exports.__esModule = true;
exports.register = void 0;
var dataByFilename = {};
var baseColor = "#e90139";
var hoverColor = "#C70139";
function register(input) {
    console.log(input);
    dataByFilename[input.filePath] = input;
}
exports.register = register;
function buidLink(filePath, loc) {
    return "vscode://file" + filePath + ":" + loc.start.line + ":" + (loc.start.column + 1);
}
var PADDING = 6;
function rerenderLayer(found, isAltKey) {
    if (isAltKey) {
        document.body.style.cursor = 'pointer';
    }
    else {
        document.body.style.cursor = 'default';
    }
    if (found.dataset && found.dataset.visprId) {
        var _a = found.dataset.visprId.split("::"), filePath = _a[0], id = _a[1];
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
            labelWrapper.id = "vispr-label-wrapper";
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
            label.id = "vispr-label";
            labelWrapper.appendChild(label);
            var el = document.getElementById("vispr-layer");
            if (!el) {
                throw new Error("no layer found");
            }
            el.innerHTML = "";
            el.appendChild(rect);
            // document.body.childNodes = [rect]
        }
    }
}
if (typeof window !== "undefined") {
    // add style tag to head
    var style = document.createElement("style");
    style.innerHTML = "\n        #vispr-label {\n            cursor: pointer;\n            background-color: " + baseColor + ";\n        }\n        #vispr-label:hover {\n            background-color: " + hoverColor + ";\n        }\n    ";
    document.head.appendChild(style);
    document.addEventListener("scroll", function () {
        // hide layers when scrolling
        var el = document.getElementById("vispr-layer");
        if (!el) {
            throw new Error("no layer found");
        }
        currentElementRef_1 = null;
        el.innerHTML = "";
    });
    document.addEventListener("mouseover", function (e) {
        var target = e.target;
        if (target && target instanceof HTMLElement) {
            if (target.id == "vispr-label" || target.id == "vispr-label-wrapper") {
                return;
            }
            var found = target.closest("[data-vispr-id]");
            if (found && found instanceof HTMLElement) {
                currentElementRef_1 = new WeakRef(found);
                rerenderLayer(found, e.altKey);
            }
        }
    }, { capture: true });
    var currentElementRef_1 = null;
    document.addEventListener("keydown", function (e) {
        if (currentElementRef_1) {
            var el = currentElementRef_1.deref();
            if (el) {
                rerenderLayer(el, e.altKey);
            }
        }
    });
    document.addEventListener("keyup", function (e) {
        if (currentElementRef_1) {
            var el = currentElementRef_1.deref();
            if (el) {
                rerenderLayer(el, e.altKey);
            }
        }
    });
    document.addEventListener("click", function (e) {
        if (!e.altKey) {
            return;
        }
        var target = e.target;
        if (target && target instanceof HTMLElement) {
            var found = target.closest("[data-vispr-id]");
            if (!found || !found.dataset || !found.dataset.visprId) {
                return;
            }
            var _a = found.dataset.visprId.split("::"), filePath = _a[0], id = _a[1];
            var data = dataByFilename[filePath];
            console.log(data);
            console.log();
            var exp = data.expressions[Number(id)];
            // window.location.href =
            var link = buidLink(filePath, exp.loc);
            console.log(link);
            var win = window.open(link, "_blank");
        }
    });
    // add layer to body
    var layer = document.createElement("div");
    layer.setAttribute("id", "vispr-layer");
    // layer is full screen
    layer.style.position = "fixed";
    layer.style.top = "0";
    layer.style.left = "0";
    layer.style.width = "100%";
    layer.style.height = "100%";
    layer.style.zIndex = "9999";
    layer.style.pointerEvents = "none";
    document.body.appendChild(layer);
}
