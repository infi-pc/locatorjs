const pluginTester = require('babel-plugin-tester').default;

const plugin =  require('../src');

const path = require('path');

pluginTester({
  plugin,
  fixtures: path.join(__dirname, 'fixtures'),
  babelOptions: require('./../babel.config.js'),
})