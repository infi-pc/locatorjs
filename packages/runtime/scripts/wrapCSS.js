/* eslint-disable no-console */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */

const fs = require("fs-extra");

async function run() {
  const content = await fs.readFile("./dist/output.css", "utf-8");
  const wrapped = `export default \`${content
    .replaceAll("`", "\\`")
    .replaceAll("\\:", "\\\\:")
    .replaceAll("\\[", "\\\\[")
    .replaceAll("\\]", "\\\\]")
    .replaceAll("\\.", "\\\\.")
    .replaceAll("\\/", "\\\\/")}\``;

  await fs.writeFile("./src/_generated_styles.ts", wrapped);
  console.log("CSS file generated");
}

if (process.env.WATCH) {
  fs.watchFile("./dist/output.css", run);
}

run();
