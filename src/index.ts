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

const RUNTIME_PATH = "@vispr/dist/runtime";

export default function transformVisprComponents(babel: Babel): {
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
            fileStorage = null
          } else {
            fileStorage = {
              filePath: state.filename,
              nextId: 0,
              expressions: [],
            }
          }
        },
        exit(path, state) {
          if (!fileStorage) {
            return
          }
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
        },
      },

      JSXElement(path) {
        if (!fileStorage) {
          return
        }
        if (path.node.openingElement.name.type === "JSXIdentifier") {
          const id = addToStorage({
            name: path.node.openingElement.name.name,
            loc: path.node.loc,
          });
          const newAttr = t.jSXAttribute(
            t.jSXIdentifier("data-vispr-id"),
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
