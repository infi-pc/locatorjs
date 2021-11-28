import * as BabelTypes from "@babel/types";
import { Visitor, NodePath } from "@babel/traverse";

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

export default function transformVisprComponents(babel: Babel): {
  visitor: Visitor<PluginOptions>;
} {
  const t = babel.types;
  let fileName: string | null = null;

  return {
    visitor: {
      Program(path, state) {
        if (!state.filename) {
          throw new Error("No file name");
        }
        fileName = state.filename      
      },

      JSXElement(path) {
        console.log(path.node);

        // console.log(path.node)
        // const ast = parse(`{ boo: "flop" }`);
        const newAttr = t.jSXAttribute(
          t.jSXIdentifier("data-vispr-id"),
          t.jSXExpressionContainer(
            t.stringLiteral("hello")
            // t.ObjectExpression([
            // ])
          )
        );
        path.node.openingElement.attributes.push(newAttr);
      },
    },
  };
}
