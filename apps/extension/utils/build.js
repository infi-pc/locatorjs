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

function manifestResources(manifest) {
  return manifest.web_accessible_resources
    .flatMap((entry) => (typeof entry === 'string' ? [entry] : entry.resources))
    .sort();
}

function comparableContentScripts(manifest) {
  return manifest.content_scripts.map((entry) => ({
    matches: entry.matches,
    js: entry.js,
    run_at: entry.run_at,
    all_frames: entry.all_frames,
    world: entry.world,
  }));
}

function assertManifestParity() {
  const chromeManifest = require('../src/manifest.v3.json');
  const firefoxManifest = require('../src/manifest.v2.json');
  const comparisons = [
    ['content scripts', comparableContentScripts],
    ['web-accessible resources', manifestResources],
  ];

  for (const [label, project] of comparisons) {
    const chromeValue = JSON.stringify(project(chromeManifest));
    const firefoxValue = JSON.stringify(project(firefoxManifest));
    if (chromeValue !== firefoxValue) {
      throw new Error(`Chrome and Firefox ${label} have drifted`);
    }
  }
}

function assertBuiltManifest(outputPath) {
  const target =
    process.env.TARGET_BROWSER === 'firefox' ? 'firefox' : 'chrome';
  const manifest = JSON.parse(
    fs.readFileSync(path.join(outputPath, 'manifest.json'), 'utf8')
  );
  const expectedManifestVersion = target === 'firefox' ? 2 : 3;
  if (manifest.manifest_version !== expectedManifestVersion) {
    throw new Error(
      `${target} build emitted manifest v${manifest.manifest_version}`
    );
  }
  if (
    manifest.version !== pkg.version ||
    manifest.description !== pkg.description
  ) {
    throw new Error(`${target} manifest package metadata is stale`);
  }
  if (
    target === 'firefox' &&
    manifest.browser_specific_settings?.gecko?.strict_min_version !== '128.0'
  ) {
    throw new Error('Firefox manifest must require MAIN-world support');
  }

  const declaredResources = new Set(manifestResources(manifest));
  const asyncChunks = fs
    .readdirSync(outputPath)
    .filter((file) => file.endsWith('.chunk.js'));
  for (const chunk of asyncChunks) {
    if (!declaredResources.has(chunk)) {
      throw new Error(`Async chunk is not web-accessible: ${chunk}`);
    }
  }
}

function assertStartupBundles(outputPath) {
  const policies = {
    'client.bundle.js': 50_000,
    'contentScript.bundle.js': 20_000,
    'hook.bundle.js': 10_000,
  };
  const forbiddenMarkers = ['lucide', '--colors-', 'SEMVER_SPEC_VERSION'];

  for (const [file, maxBytes] of Object.entries(policies)) {
    const source = fs.readFileSync(path.join(outputPath, file));
    if (source.byteLength > maxBytes) {
      throw new Error(
        `Startup bundle ${file} exceeds ${maxBytes} bytes: ${source.byteLength}`
      );
    }
    const text = source.toString('utf8');
    for (const marker of forbiddenMarkers) {
      if (text.includes(marker)) {
        throw new Error(
          `Startup bundle ${file} contains heavy marker ${marker}`
        );
      }
    }
  }
}

assertManifestParity();

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
  console.info(stats.toString({ colors: true }));

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
  assertStartupBundles(outputPath);
  assertBuiltManifest(outputPath);
});
