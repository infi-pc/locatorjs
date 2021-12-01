"use strict";
exports.__esModule = true;
exports.register = void 0;
var dataByFilename = {};
function register(input) {
    console.log(input);
    dataByFilename[input.filePath] = input;
}
exports.register = register;
var PADDING = 6;
if (typeof window !== "undefined") {
    // add style tag to head
    //   const style = document.createElement("style");
    //   style.innerHTML = `
    //         [data-vispr-id]:hover {
    //             outline: 1px solid red;
    //         }
    //     `;
    //   document.head.appendChild(style);
    document.addEventListener("mouseover", function (e) {
        if (e.target) {
            // @ts-ignore
            var found = e.target.closest("[data-vispr-id]");
            // add bouding box to the layer
            if (found) {
                var _a = found.dataset.visprId.split("::"), filePath = _a[0], id = _a[1];
                var data = dataByFilename[filePath];
                if (data) {
                    var bbox = found.getBoundingClientRect();
                    var rect = document.createElement("div");
                    rect.style.position = "absolute";
                    rect.style.left = bbox.x - PADDING + "px";
                    rect.style.top = bbox.y - PADDING + "px";
                    rect.style.width = (bbox.width + PADDING * 2) + "px";
                    rect.style.height = (bbox.height + PADDING * 2) + "px";
                    rect.style.border = "2px solid #ff0000";
                    rect.style.borderRadius = "8px";
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
    }, { capture: true });
    document.addEventListener("click", function (e) {
        if (e.target) {
            // @ts-ignore
            var found = e.target.closest("[data-vispr-id]");
            console.log(found);
            var _a = found.dataset.visprId.split("::"), filePath = _a[0], id = _a[1];
            var data = dataByFilename[filePath];
            console.log(data);
            console.log();
            var exp = data.expressions[Number(id)];
            // window.location.href =
            var link = "vscode://file" + filePath + ":" + exp.loc.start.line + ":" + (exp.loc.start.column + 1);
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
