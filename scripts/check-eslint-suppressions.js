const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const failures = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (["build", "dist", "node_modules", ".next"].includes(entry.name)) {
      continue;
    }
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.[cm]?[jt]sx?$/.test(entry.name)) inspect(file);
  }
}

function inspect(file) {
  fs.readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, index) => {
      if (/eslint-disable(?:-next-line|-line)?\b/.test(line) && !line.includes("--")) {
        failures.push(`${path.relative(root, file)}:${index + 1}`);
      }
    });
}

walk(path.join(root, "packages"));
walk(path.join(root, "apps"));
if (failures.length) {
  throw new Error(
    `Every eslint suppression needs a reason after --:\n${failures.join("\n")}`
  );
}
