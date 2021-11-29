"use strict";
exports.__esModule = true;
exports.register = void 0;
var dataByFilename = {};
function register(input) {
    console.log(input);
    dataByFilename[input.filePath] = input;
}
exports.register = register;
if (typeof window !== 'undefined') {
    // add style tag to head
    var style = document.createElement('style');
    style.innerHTML = "\n        [data-vispr-id]:hover {\n            outline: 1px solid red;\n        }\n    ";
    document.head.appendChild(style);
    document.addEventListener("click", function (e) {
        if (e.target) {
            // @ts-ignore
            var found = e.target.closest('[data-vispr-id]');
            console.log(found);
            var _a = found.dataset.visprId.split("::"), filePath = _a[0], id = _a[1];
            var data = dataByFilename[filePath];
            console.log(data);
            console.log();
            var exp = data.expressions[Number(id)];
            // window.location.href = 
            var link = "vscode://file" + filePath + ":" + exp.loc.start.line + ":" + (exp.loc.start.column + 1);
            console.log(link);
            var win = window.open(link, '_blank');
        }
    });
}
