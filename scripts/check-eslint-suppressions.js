const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const failures = [];
const sourceFilePattern = /\.[cm]?[jt]sx?$/;
const suppressionPattern =
  /(?:\/\/|\/\*)\s*eslint-disable(?:-next-line|-line)?\b/;

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (["build", "dist", "node_modules", ".next"].includes(entry.name)) {
      continue;
    }
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (sourceFilePattern.test(entry.name)) inspect(file);
  }
}

function inspect(file) {
  fs.readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, index) => {
      const suppression = suppressionPattern.exec(line);
      if (!suppression) return;

      const explanation = line.slice(suppression.index + suppression[0].length);
      if (!/--\s+\w/.test(explanation)) {
        failures.push(`${path.relative(root, file)}:${index + 1}`);
      }
    });
}

walk(path.join(root, "packages"));
walk(path.join(root, "apps"));
walk(path.join(root, "scripts"));
for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (entry.isFile() && sourceFilePattern.test(entry.name)) {
    inspect(path.join(root, entry.name));
  }
}
if (failures.length) {
  throw new Error(
    `Every eslint suppression needs a reason after --:\n${failures.join("\n")}`
  );
}
