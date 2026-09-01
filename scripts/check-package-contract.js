const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const packagesRoot = path.join(root, "packages");
const releaseVersion = require(path.join(root, "lerna.json")).version;
const packageDirectories = fs
  .readdirSync(packagesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(packagesRoot, entry.name))
  .filter((directory) => fs.existsSync(path.join(directory, "package.json")));
const packages = packageDirectories.map((directory) => ({
  directory,
  manifest: require(path.join(directory, "package.json")),
}));
const publishedPackages = packages.filter(({ manifest }) => !manifest.private);
const packageByName = new Map(
  packages.map((packageInfo) => [packageInfo.manifest.name, packageInfo])
);
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "locator-pack-"));

function run(command, args, cwd = root) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `${command} failed`);
  }
  return result.stdout;
}

function collectStringLeaves(value, label, leaves = []) {
  if (typeof value === "string") {
    leaves.push({ label, path: value });
  } else if (Array.isArray(value)) {
    value.forEach((item, index) =>
      collectStringLeaves(item, `${label}[${index}]`, leaves)
    );
  } else if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) =>
      collectStringLeaves(item, `${label}.${key}`, leaves)
    );
  }
  return leaves;
}

function packedPathExists(packedFiles, entryPath) {
  const normalized = entryPath.replace(/^\.\//, "");
  if (!normalized.includes("*")) return packedFiles.has(normalized);

  const pattern = new RegExp(
    `^${normalized
      .split("*")
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join(".+")}$`
  );
  return [...packedFiles].some((file) => pattern.test(file));
}

function validateManifest(packageInfo, packedFiles) {
  const { directory, manifest } = packageInfo;
  if (manifest.version !== releaseVersion) {
    throw new Error(
      `${manifest.name} has version ${manifest.version}; expected ${releaseVersion}`
    );
  }

  const entries = [
    ...(manifest.main ? [{ label: "main", path: manifest.main }] : []),
    ...(manifest.types ? [{ label: "types", path: manifest.types }] : []),
    ...collectStringLeaves(manifest.exports, "exports"),
  ];
  for (const entry of entries) {
    if (!packedPathExists(packedFiles, entry.path)) {
      throw new Error(
        `${manifest.name} ${entry.label} points outside its tarball: ${entry.path}`
      );
    }
  }

  for (const dependencyName of Object.keys(manifest.dependencies || {})) {
    if (
      !dependencyName.startsWith("@locator/") &&
      dependencyName !== "locatorjs"
    ) {
      continue;
    }
    const dependency = packageByName.get(dependencyName);
    if (!dependency) {
      throw new Error(`${manifest.name} depends on missing ${dependencyName}`);
    }
    if (dependency.manifest.private) {
      throw new Error(`${manifest.name} depends on private ${dependencyName}`);
    }
  }

  if (entries.length === 0) {
    throw new Error(`${directory} exposes no main, types, or exports contract`);
  }
}

function pack(packageInfo) {
  const output = JSON.parse(
    run(
      "npm",
      ["pack", "--ignore-scripts", "--json", "--pack-destination", temporary],
      packageInfo.directory
    )
  )[0];
  if (!output?.filename || !Array.isArray(output.files)) {
    throw new Error(`${packageInfo.directory} did not produce pack metadata`);
  }

  const packedFiles = new Set(output.files.map((file) => file.path));
  validateManifest(packageInfo, packedFiles);
  return {
    name: packageInfo.manifest.name,
    path: path.join(temporary, output.filename),
  };
}

function writeConsumer(tarballs) {
  const consumer = path.join(temporary, "consumer");
  fs.mkdirSync(consumer);
  const localPackages = Object.fromEntries(
    tarballs.map((tarball) => [tarball.name, `file:${tarball.path}`])
  );
  fs.writeFileSync(
    path.join(consumer, "package.json"),
    JSON.stringify({
      private: true,
      dependencies: localPackages,
      pnpm: { overrides: localPackages },
    })
  );
  run("pnpm", ["install", "--ignore-scripts"], consumer);
  return consumer;
}

function webpackConsumer(consumer, target, imports) {
  const entryPath = path.join(consumer, `${target}-entry.js`);
  const outputPath = path.join(consumer, `${target}-bundle`);
  fs.writeFileSync(
    entryPath,
    imports
      .map((specifier) => `import ${JSON.stringify(specifier)};`)
      .join("\n")
  );

  const webpack = require("webpack");
  const compiler = webpack({
    mode: "production",
    target,
    context: consumer,
    entry: entryPath,
    output: { path: outputPath, filename: "contract.js" },
    module: {
      rules: [
        { test: /\.(css|scss)$/, type: "asset/source" },
        { test: /\.(png|svg)$/, type: "asset/resource" },
      ],
    },
    resolve: {
      conditionNames: ["browser", "import", "module", "require", "default"],
    },
  });
  return new Promise((resolve, reject) => {
    compiler.run((runError, result) => {
      compiler.close((closeError) => {
        const error = runError || closeError;
        if (error) return reject(error);
        if (!result || result.hasErrors()) {
          return reject(
            new Error(
              result?.toString({
                colors: false,
                errors: true,
                warnings: false,
              }) || `${target} consumer bundle failed`
            )
          );
        }
        resolve(path.join(outputPath, "contract.js"));
      });
    });
  });
}

async function checkImports(consumer) {
  await webpackConsumer(consumer, "web", [
    "@locator/runtime",
    "@locator/shared",
    "@locator/ui",
    "@locator/react-devtools-hook",
    "@locator/styled-system/css",
    "@locator/styled-system/jsx",
    "@locator/styled-system/patterns",
    "@locator/styled-system/recipes",
    "@locator/styled-system/tokens",
    "locatorjs",
  ]);
  const nodeBundle = await webpackConsumer(consumer, "node", [
    "@locator/babel-jsx",
    "@locator/webpack-loader",
    "@locator/dev-config/eslint-base-preset.js",
    "@locator/dev-config/eslint-react-preset.js",
    "@locator/dev-config/eslint-solid-preset.js",
    "@locator/dev-config/vitest-no-webstorage.js",
  ]);
  run("node", [nodeBundle], consumer);
}

async function main() {
  try {
    run("pnpm", ["turbo", "run", "build", "--filter=./packages/*"]);
    const tarballs = publishedPackages.map(pack);
    const consumer = writeConsumer(tarballs);
    await checkImports(consumer);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
