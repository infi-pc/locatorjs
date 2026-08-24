const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const packageDirs = fs
  .readdirSync(path.join(root, "packages"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(root, "packages", entry.name))
  .filter((directory) => fs.existsSync(path.join(directory, "package.json")))
  .filter(
    (directory) => !require(path.join(directory, "package.json")).private
  );
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "locator-pack-"));

function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `${command} failed`);
  }
  return result.stdout;
}

try {
  run("pnpm", ["turbo", "run", "build", "--filter=./packages/*"]);
  const tarballs = packageDirs.map((directory) => {
    const packageName = require(path.join(directory, "package.json")).name;
    const output = JSON.parse(
      run(
        "npm",
        ["pack", "--ignore-scripts", "--json", "--pack-destination", temporary],
        directory
      )
    )[0];
    if (!output?.files?.some((file) => /\.[cm]?js$/.test(file.path))) {
      throw new Error(`${directory} packs no JavaScript entrypoint`);
    }
    const packed = run(
      "pnpm",
      ["pack", "--pack-destination", temporary],
      directory
    )
      .trim()
      .split("\n")
      .at(-1);
    if (!packed) throw new Error(`${directory} did not produce a tarball`);
    return { name: packageName, path: packed };
  });

  const consumer = path.join(temporary, "consumer");
  fs.mkdirSync(consumer);
  fs.writeFileSync(
    path.join(consumer, "package.json"),
    JSON.stringify({
      private: true,
      type: "module",
      dependencies: Object.fromEntries(
        tarballs.map((tarball) => [tarball.name, `file:${tarball.path}`])
      ),
      pnpm: {
        overrides: Object.fromEntries(
          tarballs.map((tarball) => [tarball.name, `file:${tarball.path}`])
        ),
      },
    })
  );
  run("pnpm", ["install"], consumer);
  run(
    "node",
    ["--input-type=module", "--eval", "await import('@locator/runtime')"],
    consumer
  );
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
