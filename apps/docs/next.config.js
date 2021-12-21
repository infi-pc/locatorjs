const withTM = require("next-transpile-modules")(["@locator/ui"]);

module.exports = withTM({
  reactStrictMode: true,
});
