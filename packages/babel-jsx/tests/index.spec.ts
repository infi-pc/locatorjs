import pluginTester, { prettierFormatter } from "babel-plugin-tester";

import plugin from "../src";

import path from "path";

pluginTester({
  plugin,
  fixtures: path.join(__dirname, "fixtures"),
  // babelOptions: require('./../babel.config.js'),
  snapshot: true,
  formatResult: (result, op) => {
    // Normalize absolute paths to relative ones for cross-platform compatibility
    // Match paths that start with / and end with /packages/babel-jsx
    result = result.replace(/\/[^\s"]*\/packages\/babel-jsx/g, "/babel-jsx");
    return prettierFormatter(result, op);
  },
});

pluginTester({
  plugin,
  formatResult: (result, op) => {
    const escapedCwd = JSON.stringify(process.cwd()).slice(1, -1);
    return prettierFormatter(result.replaceAll(escapedCwd, "<cwd>"), op);
  },
  tests: [
    {
      title: "supports Windows file paths",
      code: `
        export default () => {
          return <div>Hello</div>;
        };
      `,
      babelOptions: {
        filename: String.raw`D:\code\locatorjs\src\ui\App.jsx`,
      },
      snapshot: true,
    },
  ],
});
