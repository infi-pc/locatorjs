/* eslint-disable no-console */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */

const fs = require("fs-extra");

async function run() {
  const legacy = await fs.readFile("./dist/output.css", "utf-8");
  const panda = await fs.readFile("./dist/panda.css", "utf-8");
  const content = `@layer legacy, reset, base, tokens, recipes, utilities;
@layer legacy {
${legacy}
}
${panda}`;
  const wrapped = `export default ${JSON.stringify(content)}`;

  await fs.writeFile("./src/_generated_styles.ts", wrapped);
  console.log("CSS file generated");
}

if (process.env.WATCH) {
  fs.watchFile("./dist/output.css", run);
  fs.watchFile("./dist/panda.css", run);
}

run();
