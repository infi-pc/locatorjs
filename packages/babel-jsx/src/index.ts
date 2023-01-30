import * as BabelTypes from "@babel/types";
import { Visitor, NodePath } from "@babel/traverse";
import { parse, parseExpression } from "@babel/parser";
import { isDisallowedComponent } from "./isDisallowedComponent";
import {
  ComponentInfo,
  ExpressionInfo,
  FileStorage,
  SourceLocation,
  StyledDefinitionInfo,
} from "@locator/shared";

export interface PluginOptions {
  opts?: {
    env?: string;
    target?: string;
    runtime?: string;
    ignoreComponentNames?: string[];
  };
  file: {
    path: NodePath;
  };
  filename: string;
  cwd: string;
}

export interface Babel {
  types: typeof BabelTypes;
  env: () => string;
}

export default function transformLocatorJsComponents(babel: Babel): {
  visitor?: Visitor<PluginOptions>;
} {
  // there was some weird caching error when using babel.env() on Vite
  // Vite has NODE_ENV undefined when doing first dev build
  const env = process.env.BABEL_ENV || process.env.NODE_ENV || "development";

  const t = babel.types;
  let fileStorage: FileStorage | null = null;
  let wrappingComponent: {
    // id: number;
    name: string;
    locString: string;
    loc: SourceLocation;
  } | null = null;
  let lastComponentId = 0;
  let lastExpressionId = 0;
  let lastStyledId = 0;
  let currentWrappingComponentId: number | null = null;

  function addExpressionToStorage(expression: ExpressionInfo) {
    if (fileStorage) {
      const id = lastExpressionId;
      fileStorage.expressions[id] = expression;
      lastExpressionId++;
      return id;
    } else {
      throw new Error("No fileStorage");
    }
  }

  function addStyledToStorage(styled: StyledDefinitionInfo) {
    if (fileStorage) {
      const id = lastStyledId;
      fileStorage.styledDefinitions[id] = styled;
      lastStyledId++;
      return id;
    } else {
      throw new Error("No fileStorage");
    }
  }

  function addComponentToStorage(component: ComponentInfo) {
    if (fileStorage) {
      const id = lastComponentId;
      fileStorage.components[id] = component;
      lastComponentId++;
      return id;
    } else {
      throw new Error("No fileStorage");
    }
  }

  return {
    visitor: {
      Program: {
        // TODO state is any, we should check if the state depends on webpack or what it depends on?
        enter(path, state) {
          function isLocallyDisallowedComponent(name: string) {
            const opts = state?.opts?.ignoreComponentNames || [];
            return opts.includes(name);
          }

          if (state.opts?.env) {
            if (state.opts?.env !== env) {
              return;
            }
          }

          lastComponentId = 0;
          lastExpressionId = 0;
          lastStyledId = 0;
          if (!state?.filename) {
            throw new Error("No file name");
          }
          if (state.filename.includes("node_modules")) {
            fileStorage = null;
          } else {
            fileStorage = {
              filePath: state.filename.replace(state.cwd, ""),
              projectPath: state.cwd,
              expressions: [],
              styledDefinitions: [],
              components: [],
            };
          }

          // NEED TO RUN MANUAL TRAVERSE, SO IT MAKE EDITS BEFORE ALL OTHER PLUGINS
          path.traverse({
            // TODO add also for arrow function and class components
            FunctionDeclaration: {
              enter(path, state) {
                if (!fileStorage) {
                  return;
                }
                if (!path || !path.node || !path.node.id || !path.node.loc) {
                  return;
                }
                const name = path.node.id.name;

                wrappingComponent = {
                  name,
                  locString:
                    path.node.loc.start.line + ":" + path.node.loc.start.column,
                  loc: path.node.loc,
                };
                currentWrappingComponentId =
                  addComponentToStorage(wrappingComponent);
              },
              exit(path, state) {
                if (!fileStorage) {
                  return;
                }
                if (!path || !path.node || !path.node.id || !path.node.loc) {
                  return;
                }
                const name = path.node.id.name;

                // Reset wrapping component
                if (
                  wrappingComponent &&
                  wrappingComponent.name === name &&
                  wrappingComponent.locString ===
                    path.node.loc.start.line + ":" + path.node.loc.start.column
                ) {
                  wrappingComponent = null;
                }
              },
            },
            TaggedTemplateExpression(path) {
              if (!fileStorage) {
                return;
              }
              const tag = path.node.tag;
              if (tag.type === "MemberExpression") {
                const property = tag.property;
                const object = tag.object;
                if (
                  object.type === "Identifier" &&
                  object.name === "styled" &&
                  property.type === "Identifier"
                ) {
                  let name = null;
                  const parent = path.parent;
                  if (parent.type === "VariableDeclarator") {
                    if (parent.id.type === "Identifier") {
                      name = parent.id.name;
                    }
                  }

                  if (path.node.loc) {
                    const id = addStyledToStorage({
                      name: name,
                      loc: path.node.loc,
                      htmlTag: property.name,
                    });
                    path.node.tag = t.callExpression(
                      t.memberExpression(tag, t.identifier("attrs")),
                      [
                        t.arrowFunctionExpression(
                          [],
                          t.objectExpression([
                            t.objectProperty(
                              t.stringLiteral("data-locatorjs-styled"),
                              t.stringLiteral(createDataId(fileStorage, id))
                            ),
                          ])
                        ),
                      ]
                    );
                  }
                }
              }
            },
            JSXElement(path) {
              if (!fileStorage) {
                return;
              }
              function getName(
                el:
                  | BabelTypes.JSXIdentifier
                  | BabelTypes.JSXMemberExpression
                  | BabelTypes.JSXNamespacedName
              ): string {
                if (el.type === "JSXIdentifier") {
                  return el.name;
                } else if (el.type === "JSXMemberExpression") {
                  return getName(el.object) + "." + el.property.name;
                } else if (el.type === "JSXNamespacedName") {
                  return el.namespace.name + "." + el.name.name;
                }
                return "";
              }
              let name = getName(path.node.openingElement.name);

              if (
                name &&
                !isDisallowedComponent(name) &&
                !isLocallyDisallowedComponent(name)
              ) {
                if (path.node.loc) {
                  const id = addExpressionToStorage({
                    name: name,
                    loc: path.node.loc,
                    wrappingComponentId: currentWrappingComponentId,
                  });
                  const newAttr = t.jSXAttribute(
                    t.jSXIdentifier("data-locatorjs-id"),
                    t.jSXExpressionContainer(
                      t.stringLiteral(
                        // this is stored by projectPath+filePath because that's the only unique identifier
                        createDataId(fileStorage, id)
                      )
                      // t.ObjectExpression([
                      // ])
                    )
                  );
                  path.node.openingElement.attributes.push(newAttr);
                }
              }
            },
          });
        },
        exit(path, state) {
          if (state.opts?.env) {
            if (state.opts.env !== env) {
              return;
            }
          }

          if (!fileStorage) {
            return;
          }
          const dataCode = JSON.stringify(fileStorage);

          const dataAst = parseExpression(dataCode, {
            sourceType: "script",
          });

          const insertCode = `(() => {
            if (typeof window !== "undefined") {
              window.__LOCATOR_DATA__ = window.__LOCATOR_DATA__ || {};
              window.__LOCATOR_DATA__["${createFullPath(
                fileStorage
              )}"] = ${dataCode};
            }
          })()`;

          // `function __bindLocatorExpression(id) {
          //   return require("@locator/runtime").__bindLocatorExpression(${createFullPath(
          //     fileStorage
          //   )}, id);
          // }`;

          const insertAst = parseExpression(insertCode, {
            sourceType: "script",
          });

          path.node.body.push(t.expressionStatement(insertAst));
        },
      },
    },
  };
}

function createDataId(fileStorage: FileStorage, id: number): string {
  return createFullPath(fileStorage) + "::" + String(id);
}

function createFullPath(fileStorage: FileStorage): string {
  return fileStorage.projectPath + fileStorage.filePath;
}
