/* eslint-disable no-console */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */

const fs = require("fs-extra");

async function run() {
  const panda = await fs.readFile("./dist/panda.css", "utf-8");
  const wrapped = `export default ${JSON.stringify(panda)};\n`;

  await fs.writeFile("./src/_generated_styles.ts", wrapped);
  console.log("CSS file generated");
}

if (process.env.WATCH) {
  fs.watchFile("./dist/panda.css", run);
}

run();
