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
  path: string;
  nextId: number;
  expressions: ExpressionInfo[];
};

const RUNTIME_PATH = "visprPlugin/src/runtime.js";

export default function transformVisprComponents(babel: Babel): {
  visitor: Visitor<PluginOptions>;
} {
  const t = babel.types;
  let fileStorage: FileStorage = {
    path: "",
    nextId: 0,
    expressions: [],
  };

  function addToStorage(expression: ExpressionInfo) {
    const id = fileStorage.nextId;
    fileStorage.expressions[id] = expression;
    fileStorage.nextId++;
    return id;
  }

  return {
    visitor: {
      Program: {
        // TODO state is any, we should check if the state depends on webpack or what it depends on?
        enter(path, state: any) {
          if (!state.filename) {
            throw new Error("No file name");
          }
          fileStorage.path = state.filename;
        },
        exit(path, state) {
          const dataCode = JSON.stringify(fileStorage)

          const dataAst = parseExpression(dataCode, {
            sourceType: "script",
          })
          

          path.node.body.push(
            
            t.expressionStatement(
              t.callExpression(
                t.memberExpression(
                  t.callExpression(t.identifier("require"), [
                    t.stringLiteral(RUNTIME_PATH),
                  ]),
                  t.identifier("register")
                ),
                [dataAst],
              ),
            )
          );
          console.log("3. Exit");
        },
      },

      JSXElement(path) {
        if (path.node.openingElement.name.type === "JSXIdentifier") {
          const id = addToStorage({
            name: path.node.openingElement.name.name,
            loc: path.node.loc,
          });
          const newAttr = t.jSXAttribute(
            t.jSXIdentifier("data-vispr-id"),
            t.jSXExpressionContainer(
              t.stringLiteral(String(id))
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
