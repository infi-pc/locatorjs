"use strict";
exports.__esModule = true;
var parser_1 = require("@babel/parser");
var isDisallowedComponent_1 = require("./isDisallowedComponent");
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
        else {
            throw new Error("No fileStorage");
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
            // TODO add also for arrow function
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
                    if (wrappingComponent &&
                        wrappingComponent.name === name &&
                        wrappingComponent.locString ===
                            path.node.loc.start.line + ":" + path.node.loc.start.column) {
                        wrappingComponent = null;
                    }
                }
            },
            TaggedTemplateExpression: function (path) {
                if (!fileStorage) {
                    return;
                }
                var tag = path.node.tag;
                if (tag.type === "MemberExpression") {
                    var property = tag.property;
                    var object = tag.object;
                    if (object.type === "Identifier" &&
                        object.name === "styled" &&
                        property.type === "Identifier") {
                        var name_1 = null;
                        var parent_1 = path.parent;
                        if (parent_1.type === "VariableDeclarator") {
                            if (parent_1.id.type === "Identifier") {
                                name_1 = parent_1.id.name;
                            }
                        }
                        var id = addToStorage({
                            type: "styledComponent",
                            name: name_1,
                            loc: path.node.loc,
                            htmlTag: property.name || null
                        });
                        path.node.tag = t.callExpression(t.memberExpression(tag, t.identifier("attrs")), [
                            t.arrowFunctionExpression([], t.objectExpression([
                                t.objectProperty(t.stringLiteral("data-locatorjs-styled"), t.stringLiteral(createDataId(fileStorage, id))),
                            ])),
                        ]);
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
                if (name && !(0, isDisallowedComponent_1.isDisallowedComponent)(name)) {
                    var id = addToStorage({
                        type: "jsx",
                        name: name,
                        loc: path.node.loc,
                        wrappingComponent: (wrappingComponent === null || wrappingComponent === void 0 ? void 0 : wrappingComponent.name) || null
                    });
                    var newAttr = t.jSXAttribute(t.jSXIdentifier("data-locatorjs-id"), t.jSXExpressionContainer(t.stringLiteral(
                    // this is stored by projectPath+filePath because that's the only unique identifier
                    createDataId(fileStorage, id))
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
function createDataId(fileStorage, id) {
    return fileStorage.projectPath + fileStorage.filePath + "::" + String(id);
}
