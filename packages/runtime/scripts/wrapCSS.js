/* eslint-disable no-console -- build script reports generated artifact status. */
/* eslint-disable no-undef -- build script runs in CommonJS Node. */
/* eslint-disable @typescript-eslint/no-var-requires -- build script loads filesystem helpers in CommonJS. */

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
