#!/usr/bin/env node

/**
 * Chrome 扩展打包脚本
 * 完整流程：构建依赖 -> 构建扩展 -> 打包 zip
 *
 * 用法：
 *   node utils/release.js           # 打包 Chrome 版本
 *   node utils/release.js --firefox # 打包 Firefox 版本
 *   node utils/release.js --all     # 打包所有版本
 */

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs-extra");

// archiver 可选，没有则 fallback 到系统 zip 命令
let archiver;
try {
  archiver = require("archiver");
} catch {
  archiver = null;
}

// 路径配置
const ROOT_DIR = path.resolve(__dirname, "../../..");
const EXTENSION_DIR = path.resolve(__dirname, "..");
const RUNTIME_DIR = path.resolve(ROOT_DIR, "packages/runtime");
const BUILD_DIR = path.resolve(EXTENSION_DIR, "build");

// 颜色输出
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
 * 执行命令并实时输出
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
 * 构建 runtime 包
 */
async function buildRuntime() {
  logStep(1, "构建 @locator/runtime 包...");

  await execCommand("pnpm run build", { cwd: RUNTIME_DIR });
  logSuccess("runtime 构建完成");
}

/**
 * 构建扩展
 */
async function buildExtension(target = "chrome") {
  logStep(2, `构建 ${target} 扩展...`);

  const buildCmd = target === "firefox" ? "pnpm run build:firefox" : "pnpm run build";
  await execCommand(buildCmd, { cwd: EXTENSION_DIR });
  logSuccess(`${target} 扩展构建完成`);
}

/**
 * 使用 archiver 打包 zip（纯 Node.js 实现）
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
 * 使用系统 zip 命令打包
 */
async function createZipWithSystem(sourceDir, outputPath) {
  await execCommand(`cd "${sourceDir}" && zip -r "${outputPath}" .`);
  const stats = fs.statSync(outputPath);
  return (stats.size / 1024).toFixed(1);
}

/**
 * 打包成 zip
 */
async function packExtension(target = "chrome") {
  logStep(3, `打包 ${target}.zip...`);

  const sourceDir = path.join(BUILD_DIR, `production_${target}`);
  const outputPath = path.join(BUILD_DIR, `${target}.zip`);

  // 确保源目录存在
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`构建目录不存在: ${sourceDir}`);
  }

  // 删除旧的 zip
  if (fs.existsSync(outputPath)) {
    fs.removeSync(outputPath);
  }

  // 使用 archiver 或 fallback 到系统 zip 命令
  let size;
  if (archiver) {
    size = await createZipWithArchiver(sourceDir, outputPath);
  } else {
    size = await createZipWithSystem(sourceDir, outputPath);
  }

  logSuccess(`打包完成: ${outputPath} (${size}KB)`);
  return outputPath;
}

/**
 * 获取版本信息
 */
function getVersionInfo() {
  const pkg = require(path.join(EXTENSION_DIR, "package.json"));
  return {
    version: pkg.version,
    name: pkg.name,
  };
}

/**
 * 主流程
 */
async function main() {
  const args = process.argv.slice(2);
  const buildFirefox = args.includes("--firefox");
  const buildAll = args.includes("--all");
  const skipRuntime = args.includes("--skip-runtime");

  const startTime = Date.now();
  const { version, name } = getVersionInfo();

  log(`\n${"=".repeat(50)}`, "bright");
  log(`  ${name} v${version} 打包脚本`, "bright");
  log(`${"=".repeat(50)}`, "bright");

  try {
    // 1. 构建依赖
    if (!skipRuntime) {
      await buildRuntime();
    } else {
      log("\n[跳过] runtime 构建", "yellow");
    }

    const outputs = [];

    // 2. 构建和打包
    if (buildAll) {
      // 构建所有版本
      await buildExtension("chrome");
      outputs.push(await packExtension("chrome"));

      await buildExtension("firefox");
      outputs.push(await packExtension("firefox"));
    } else if (buildFirefox) {
      // 仅 Firefox
      await buildExtension("firefox");
      outputs.push(await packExtension("firefox"));
    } else {
      // 默认 Chrome
      await buildExtension("chrome");
      outputs.push(await packExtension("chrome"));
    }

    // 完成
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`\n${"=".repeat(50)}`, "green");
    log(`  打包完成! 耗时 ${duration}s`, "green");
    log(`${"=".repeat(50)}`, "green");
    log("\n产物:");
    outputs.forEach((p) => log(`  - ${p}`));
    log("");
  } catch (error) {
    logError(`打包失败: ${error.message}`);
    process.exit(1);
  }
}

// 运行
main();
