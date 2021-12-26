"use strict";
exports.__esModule = true;
var parser_1 = require("@babel/parser");
var RUNTIME_PATH = "@locator/runtime";
function transformLocatorJsComponents(babel) {
    var t = babel.types;
    var fileStorage = null;
    var wrappingComponent = null;
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
                            filePath: state.filename.replace(state.cwd, ""),
                            projectPath: state.cwd,
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
            FunctionDeclaration: {
                enter: function (path, state) {
                    if (!fileStorage) {
                        return;
                    }
                    if (!path || !path.node || !path.node.id || !path.node.loc) {
                        return;
                    }
                    var name = path.node.id.name;
                    wrappingComponent = {
                        name: name,
                        locString: path.node.loc.start.line + ":" + path.node.loc.start.column
                    };
                },
                exit: function (path, state) {
                    if (!fileStorage) {
                        return;
                    }
                    if (!path || !path.node || !path.node.id || !path.node.loc) {
                        return;
                    }
                    var name = path.node.id.name;
                    // Reset wrapping component
                    if (wrappingComponent && wrappingComponent.name === name && wrappingComponent.locString === path.node.loc.start.line + ":" + path.node.loc.start.column) {
                        wrappingComponent = null;
                    }
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
                        loc: path.node.loc,
                        wrappingComponent: (wrappingComponent === null || wrappingComponent === void 0 ? void 0 : wrappingComponent.name) || null
                    });
                    var newAttr = t.jSXAttribute(t.jSXIdentifier("data-locatorjs-id"), t.jSXExpressionContainer(t.stringLiteral(fileStorage.projectPath + fileStorage.filePath + "::" + String(id))
                    // t.ObjectExpression([
                    // ])
                    ));
                    path.node.openingElement.attributes.push(newAttr);
                }
            }
        }
    };
}
exports["default"] = transformLocatorJsComponents;
