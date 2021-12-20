import pluginTester from 'babel-plugin-tester';

import plugin from '../src';

import path from 'path';

pluginTester({
  plugin,
  fixtures: path.join(__dirname, 'fixtures'),
  // babelOptions: require('./../babel.config.js'),
  snapshot: true,
})