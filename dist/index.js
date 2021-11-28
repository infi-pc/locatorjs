"use strict";
exports.__esModule = true;
function transformVisprComponents(babel) {
    var t = babel.types;
    var fileName = null;
    return {
        visitor: {
            Program: function (path, state) {
                if (!state.filename) {
                    throw new Error("No file name");
                }
                fileName = state.filename;
            },
            JSXElement: function (path) {
                console.log(path.node);
                // console.log(path.node)
                // const ast = parse(`{ boo: "flop" }`);
                var newAttr = t.jSXAttribute(t.jSXIdentifier("data-vispr-id"), t.jSXExpressionContainer(t.stringLiteral("hello")
                // t.ObjectExpression([
                // ])
                ));
                path.node.openingElement.attributes.push(newAttr);
            }
        }
    };
}
exports["default"] = transformVisprComponents;
