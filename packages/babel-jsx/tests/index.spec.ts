import pluginTester from "babel-plugin-tester";
// @ts-ignore
import prettier from "babel-plugin-tester/dist/formatters/prettier.js";

import plugin from "../src";

import path from "path";

pluginTester({
  plugin,
  fixtures: path.join(__dirname, "fixtures"),
  // babelOptions: require('./../babel.config.js'),
  snapshot: true,
  formatResult: (result, op) => {
    result = result.replace(/\"[\w/\\_-]*locatorjs\/packages/g, '"');
    return prettier(result, op);
  },
});
