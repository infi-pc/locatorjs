const fs = require("fs");
const path = require("path");
const webpack = require("webpack");

const root = path.resolve(__dirname, "..");

function writeFacades(packageName) {
  const dist = path.join(root, "packages", packageName, "dist");
  if (packageName === "shared") {
    fs.writeFileSync(
      path.join(dist, "index.d.mts"),
      'export * from "./index.js";\n'
    );
    fs.writeFileSync(
      path.join(dist, "config.d.mts"),
      'export * from "./config.js";\n'
    );
  } else {
    fs.writeFileSync(
      path.join(dist, "index.server.d.mts"),
      'export * from "./index.server.js";\nexport { setup as default } from "./index.server.js";\n'
    );
  }
}

function entries(packageName) {
  const dist = path.join(root, "packages", packageName, "dist");
  return packageName === "shared"
    ? {
        index: path.join(dist, "index.js"),
        config: path.join(dist, "config.js"),
      }
    : { "index.server": path.join(dist, "index.server.js") };
}

function externals(packageName, type) {
  const dist = path.join(root, "packages", packageName, "dist");
  return ({ context, request }, callback) => {
    if (
      packageName === "shared" &&
      context === dist &&
      (request === "./config" || request === "./config.js")
    ) {
      callback(null, `./config.${type === "module" ? "mjs" : "cjs"}`);
      return;
    }
    if (
      packageName === "runtime" &&
      request === "@locator/shared/strict-config"
    ) {
      callback(null, request);
      return;
    }
    callback();
  };
}

function config(packageName, format) {
  const module = format === "esm";
  return {
    mode: "production",
    target: "node",
    devtool: false,
    optimization: { minimize: false },
    ...(module ? { experiments: { outputModule: true } } : {}),
    context: path.join(root, "packages", packageName, "dist"),
    entry: entries(packageName),
    externalsType: module ? "module" : "commonjs",
    externals: [externals(packageName, module ? "module" : "commonjs")],
    output: {
      path: path.join(root, "packages", packageName, "dist"),
      filename: `[name].${module ? "mjs" : "cjs"}`,
      ...(module ? { module: true } : {}),
      library: { type: module ? "module" : "commonjs2" },
    },
  };
}

function run(packageName, watch) {
  writeFacades(packageName);
  const compilers = [
    config(packageName, "esm"),
    config(packageName, "cjs"),
  ].map((configuration) => webpack(configuration));
  if (watch) {
    for (const compiler of compilers) {
      compiler.watch({}, (error, stats) => {
        if (error) console.error(error);
        if (stats?.hasErrors())
          console.error(stats.toString({ colors: false, errors: true }));
      });
    }
    return;
  }
  return Promise.all(
    compilers.map(
      (compiler) =>
        new Promise((resolve, reject) => {
          compiler.run((error, stats) => {
            compiler.close(() => undefined);
            if (error) return reject(error);
            if (stats?.hasErrors())
              return reject(
                new Error(stats.toString({ colors: false, errors: true }))
              );
            resolve();
          });
        })
    )
  );
}

const [packageName, watchFlag] = process.argv.slice(2);
if (packageName !== "shared" && packageName !== "runtime") {
  console.error("Usage: node scripts/build-native.js shared|runtime [--watch]");
  process.exitCode = 1;
} else {
  Promise.resolve(run(packageName, watchFlag === "--watch")).catch((error) => {
    console.error(error.stack || error);
    process.exitCode = 1;
  });
}
