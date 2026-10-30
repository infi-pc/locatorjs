const path = require("path");

module.exports = {
  plugins: [
    require("@pandacss/dev/postcss")({
      configPath: path.join(__dirname, "panda.config.ts"),
    }),
  ],
};
