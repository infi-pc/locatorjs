import pluginTester, { prettierFormatter } from "babel-plugin-tester";

import plugin from "../src";

import path from "path";

pluginTester({
  plugin,
  fixtures: path.join(__dirname, "fixtures"),
  // babelOptions: require('./../babel.config.js'),
  snapshot: true,
  formatResult: (result, op) => {
    result = result.replace(/\"[\w/\\_-]*locatorjs\/packages/g, '"');
    return prettierFormatter(result, op);
  },
});
