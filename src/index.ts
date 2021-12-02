import * as BabelTypes from "@babel/types";
import { Visitor, NodePath } from "@babel/traverse";
import { parse, parseExpression } from "@babel/parser";

export interface PluginOptions {
  opts?: {
    target?: string;
    runtime?: string;
  };
  file: {
    path: NodePath;
  };
}

export interface Babel {
  types: typeof BabelTypes;
}
type ExpressionInfo = {
  name: string;
  loc: BabelTypes.SourceLocation | null;
};

type FileStorage = {
  filePath: string;
  nextId: number;
  expressions: ExpressionInfo[];
};

const RUNTIME_PATH = "dev_locatorjs/dist/runtime";

export default function transformLocatorJsComponents(babel: Babel): {
  visitor: Visitor<PluginOptions>;
} {
  const t = babel.types;
  let fileStorage: FileStorage | null = null;

  function addToStorage(expression: ExpressionInfo) {
    if (fileStorage) {
      const id = fileStorage.nextId;
      fileStorage.expressions[id] = expression;
      fileStorage.nextId++;
      return id;
    }
  }

  return {
    visitor: {
      Program: {
        // TODO state is any, we should check if the state depends on webpack or what it depends on?
        enter(path, state: any) {
          if (!state.filename) {
            throw new Error("No file name");
          }
          if (state.filename.includes("node_modules")) {
            fileStorage = null;
          } else {
            fileStorage = {
              filePath: state.filename,
              nextId: 0,
              expressions: [],
            };
          }
        },
        exit(path, state) {
          if (!fileStorage) {
            return;
          }
          const dataCode = JSON.stringify(fileStorage);

          const dataAst = parseExpression(dataCode, {
            sourceType: "script",
          });

          path.node.body.push(
            t.expressionStatement(
              t.callExpression(
                t.memberExpression(
                  t.callExpression(t.identifier("require"), [
                    t.stringLiteral(RUNTIME_PATH),
                  ]),
                  t.identifier("register")
                ),
                [dataAst]
              )
            )
          );
        },
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

        if (name) {
          const id = addToStorage({
            name: name,
            loc: path.node.loc,
          });
          const newAttr = t.jSXAttribute(
            t.jSXIdentifier("data-locatorjs-id"),
            t.jSXExpressionContainer(
              t.stringLiteral(fileStorage.filePath + "::" + String(id))
              // t.ObjectExpression([
              // ])
            )
          );
          path.node.openingElement.attributes.push(newAttr);
        }

        // console.log(path.node)
        // const ast = parse(`{ boo: "flop" }`);
      },
    },
  };
}
