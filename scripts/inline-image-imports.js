const fs = require("fs");
const path = require("path");

/** Publish image URLs as strings, independent of the consumer's asset loaders. */
module.exports = ({ types }) => ({
  visitor: {
    ImportDeclaration(importPath, state) {
      const source = importPath.node.source.value;
      const extension = path.extname(source);
      if (!source.startsWith(".") || ![".svg", ".png"].includes(extension))
        return;
      const [specifier] = importPath.node.specifiers;
      if (
        importPath.node.specifiers.length !== 1 ||
        !types.isImportDefaultSpecifier(specifier)
      ) {
        throw importPath.buildCodeFrameError("Images need a default import.");
      }
      const filename = path.resolve(path.dirname(state.filename), source);
      const mime = extension === ".svg" ? "image/svg+xml" : "image/png";
      const data = fs.readFileSync(filename).toString("base64");
      importPath.replaceWith(
        types.variableDeclaration("const", [
          types.variableDeclarator(
            specifier.local,
            types.stringLiteral(`data:${mime};base64,${data}`)
          ),
        ])
      );
    },
  },
});
