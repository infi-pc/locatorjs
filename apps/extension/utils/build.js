// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';
process.env.ASSET_PATH = '/';

// Manually set npm_package_* env vars (not auto-set when calling node directly)
var pkg = require('../package.json');
process.env.npm_package_version = pkg.version;
process.env.npm_package_description = pkg.description;

var webpack = require('webpack'),
  config = require('../webpack.config'),
  fs = require('fs'),
  path = require('path');

delete config.chromeExtensionBoilerplate;

config.mode = 'production';

webpack(config, function (err, stats) {
  if (err) {
    console.error(err.stack || err);
    if (err.details) {
      console.error(err.details);
    }
    process.exit(1);
  }

  // Print the human-readable summary before deciding the exit code, so a failing
  // build still leaves a usable log behind.
  console.log(stats.toString({ colors: true }));

  const info = stats.toJson();
  if (stats.hasWarnings()) {
    console.warn(info.warnings);
  }
  if (stats.hasErrors()) {
    console.error(info.errors);
    // Without this the build exits 0 on a compile error and CI reports green.
    process.exit(1);
  }

  const outputPath = config.output.path;
  const client = fs.readFileSync(path.join(outputPath, 'client.bundle.js'));
  if (client.byteLength > 50_000) {
    throw new Error(`Injected startup shell exceeds 50 KB: ${client.byteLength}`);
  }
  const manifest = fs.readFileSync(path.join(outputPath, 'manifest.json'), 'utf8');
  const asyncChunks = fs
    .readdirSync(outputPath)
    .filter((file) => file.endsWith('.chunk.js'));
  for (const chunk of asyncChunks) {
    if (!manifest.includes(chunk)) {
      throw new Error(`Async chunk is not web-accessible: ${chunk}`);
    }
  }
});
