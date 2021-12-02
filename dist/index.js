"use strict";
exports.__esModule = true;
var parser_1 = require("@babel/parser");
var RUNTIME_PATH = "dev_locatorjs/dist/runtime";
function transformLocatorJsComponents(babel) {
    var t = babel.types;
    var fileStorage = null;
    function addToStorage(expression) {
        if (fileStorage) {
            var id = fileStorage.nextId;
            fileStorage.expressions[id] = expression;
            fileStorage.nextId++;
            return id;
        }
    }
    return {
        visitor: {
            Program: {
                // TODO state is any, we should check if the state depends on webpack or what it depends on?
                enter: function (path, state) {
                    if (!state.filename) {
                        throw new Error("No file name");
                    }
                    if (state.filename.includes("node_modules")) {
                        fileStorage = null;
                    }
                    else {
                        fileStorage = {
                            filePath: state.filename,
                            nextId: 0,
                            expressions: []
                        };
                    }
                },
                exit: function (path, state) {
                    if (!fileStorage) {
                        return;
                    }
                    var dataCode = JSON.stringify(fileStorage);
                    var dataAst = (0, parser_1.parseExpression)(dataCode, {
                        sourceType: "script"
                    });
                    path.node.body.push(t.expressionStatement(t.callExpression(t.memberExpression(t.callExpression(t.identifier("require"), [
                        t.stringLiteral(RUNTIME_PATH),
                    ]), t.identifier("register")), [dataAst])));
                }
            },
            JSXElement: function (path) {
                if (!fileStorage) {
                    return;
                }
                function getName(el) {
                    if (el.type === "JSXIdentifier") {
                        return el.name;
                    }
                    else if (el.type === "JSXMemberExpression") {
                        return getName(el.object) + "." + el.property.name;
                    }
                    else if (el.type === "JSXNamespacedName") {
                        return el.namespace.name + "." + el.name.name;
                    }
                    return "";
                }
                var name = getName(path.node.openingElement.name);
                if (name) {
                    var id = addToStorage({
                        name: name,
                        loc: path.node.loc
                    });
                    var newAttr = t.jSXAttribute(t.jSXIdentifier("data-locatorjs-id"), t.jSXExpressionContainer(t.stringLiteral(fileStorage.filePath + "::" + String(id))
                    // t.ObjectExpression([
                    // ])
                    ));
                    path.node.openingElement.attributes.push(newAttr);
                }
                // console.log(path.node)
                // const ast = parse(`{ boo: "flop" }`);
            }
        }
    };
}
exports["default"] = transformLocatorJsComponents;
