// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';
process.env.ASSET_PATH = '/';

// 手动设置 npm_package_* 环境变量（直接调用 node 时不会自动设置）
var pkg = require('../package.json');
process.env.npm_package_version = pkg.version;
process.env.npm_package_description = pkg.description;

var webpack = require('webpack'),
  config = require('../webpack.config');

delete config.chromeExtensionBoilerplate;

config.mode = 'production';

webpack(config, function (err, stats) {
  if (err) {
    console.error(err.stack || err);
    if (err.details) {
      console.error(err.details);
    }
    return;
  }

  const info = stats.toJson();
  if (stats.hasErrors()) {
    console.error(info.errors);
  }
  if (stats.hasWarnings()) {
    console.warn(info.warnings);
  }
  console.log(stats.toString({ colors: true }));
});
