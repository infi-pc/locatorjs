const fs = require("fs");
const path = require("path");

const packageDirectory = process.cwd();
const distDirectory = path.join(packageDirectory, "dist");

if (path.dirname(distDirectory) !== packageDirectory) {
  throw new Error(`Refusing to clean unexpected path: ${distDirectory}`);
}

fs.rmSync(distDirectory, { recursive: true, force: true });
