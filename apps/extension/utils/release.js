#!/usr/bin/env node

/**
 * Chrome extension packaging script
 * Full pipeline: build deps -> build extension -> package zip
 *
 * Usage:
 *   node utils/release.js           # Package Chrome version
 *   node utils/release.js --firefox # Package Firefox version
 *   node utils/release.js --all     # Package all versions
 */

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs-extra");

// archiver is optional, falls back to system zip command
let archiver;
try {
  archiver = require("archiver");
} catch {
  archiver = null;
}

// Path configuration
const ROOT_DIR = path.resolve(__dirname, "../../..");
const EXTENSION_DIR = path.resolve(__dirname, "..");
const BUILD_DIR = path.resolve(EXTENSION_DIR, "build");

// Color output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[$${step}] ${message}`, "blue");
}

function logSuccess(message) {
  log(`✓ ${message}`, "green");
}

function logError(message) {
  log(`✗ ${message}`, "red");
}

/**
 * Execute a command with real-time output
 */
function execCommand(command, options = {}) {
  const { cwd = process.cwd(), silent = false } = options;

  return new Promise((resolve, reject) => {
    if (!silent) {
      log(`  > ${command}`, "yellow");
    }

    const child = spawn(command, {
      cwd,
      shell: true,
      stdio: silent ? "pipe" : "inherit",
    });

    let stdout = "";
    let stderr = "";

    if (silent) {
      child.stdout?.on("data", (data) => (stdout += data));
      child.stderr?.on("data", (data) => (stderr += data));
    }

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed with code ${code}: ${command}`));
      }
    });

    child.on("error", reject);
  });
}

/**
 * Build everything the extension bundle resolves at build time.
 *
 * Building only `packages/runtime` was not enough: its own `build` script does
 * not build `@locator/ui`, `@locator/shared` or `@locator/styled-system`, and
 * all three are resolved through `main: "dist/index.js"`. On a clean checkout
 * that failed at the webpack step; with stale dists lying around it silently
 * shipped a zip missing whatever had changed in those packages. Turbo's
 * `...` selector builds the extension's dependencies in order.
 */
async function buildDependencies() {
  logStep(1, "Building extension dependencies...");

  await execCommand(
    "pnpm turbo run build --filter=locatorjs-extension^...",
    { cwd: ROOT_DIR }
  );
  logSuccess("Dependency build complete");
}

/**
 * Build the extension
 */
async function buildExtension(target = "chrome") {
  logStep(2, `Building ${target} extension...`);

  const buildCmd = target === "firefox" ? "pnpm run build:firefox" : "pnpm run build";
  await execCommand(buildCmd, { cwd: EXTENSION_DIR });
  logSuccess(`${target} extension build complete`);
}

/**
 * Create zip using archiver (pure Node.js)
 */
async function createZipWithArchiver(sourceDir, outputPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      const size = (archive.pointer() / 1024).toFixed(1);
      resolve(size);
    });

    archive.on("error", reject);
    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

/**
 * Create zip using system zip command
 */
async function createZipWithSystem(sourceDir, outputPath) {
  await execCommand(`cd "${sourceDir}" && zip -r "${outputPath}" .`);
  const stats = fs.statSync(outputPath);
  return (stats.size / 1024).toFixed(1);
}

/**
 * Package the extension into a zip
 */
async function packExtension(target = "chrome") {
  logStep(3, `Packaging ${target}.zip...`);

  const sourceDir = path.join(BUILD_DIR, `production_${target}`);
  const outputPath = path.join(BUILD_DIR, `${target}.zip`);

  // Ensure source directory exists
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Build directory does not exist: ${sourceDir}`);
  }

  // Remove old zip
  if (fs.existsSync(outputPath)) {
    fs.removeSync(outputPath);
  }

  // Use archiver or fall back to system zip command
  let size;
  if (archiver) {
    size = await createZipWithArchiver(sourceDir, outputPath);
  } else {
    size = await createZipWithSystem(sourceDir, outputPath);
  }

  logSuccess(`Packaging complete: ${outputPath} (${size}KB)`);
  return outputPath;
}

/**
 * Get version info from package.json
 */
function getVersionInfo() {
  const pkg = require(path.join(EXTENSION_DIR, "package.json"));
  return {
    version: pkg.version,
    name: pkg.name,
  };
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const buildFirefox = args.includes("--firefox");
  const buildAll = args.includes("--all");
  const skipRuntime = args.includes("--skip-runtime");

  const startTime = Date.now();
  const { version, name } = getVersionInfo();

  log(`\n${"=".repeat(50)}`, "bright");
  log(`  ${name} v${version} release script`, "bright");
  log(`${"=".repeat(50)}`, "bright");

  try {
    // 1. Build dependencies
    if (!skipRuntime) {
      await buildDependencies();
    } else {
      log("\n[Skipped] runtime build", "yellow");
    }

    const outputs = [];

    // 2. Build and package
    if (buildAll) {
      // Build all versions
      await buildExtension("chrome");
      outputs.push(await packExtension("chrome"));

      await buildExtension("firefox");
      outputs.push(await packExtension("firefox"));
    } else if (buildFirefox) {
      // Firefox only
      await buildExtension("firefox");
      outputs.push(await packExtension("firefox"));
    } else {
      // Default: Chrome
      await buildExtension("chrome");
      outputs.push(await packExtension("chrome"));
    }

    // Done
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`\n${"=".repeat(50)}`, "green");
    log(`  Packaging complete! Time elapsed: ${duration}s`, "green");
    log(`${"=".repeat(50)}`, "green");
    log("\nArtifacts:");
    outputs.forEach((p) => log(`  - ${p}`));
    log("");
  } catch (error) {
    logError(`Packaging failed: ${error.message}`);
    process.exit(1);
  }
}

// Run
main();
