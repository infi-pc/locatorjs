module.exports = {
  extends: ["next", "./eslint-base-preset.js"],
  settings: {
    next: {
      rootDir: ["apps/*/", "packages/*/"],
    },
  },
};
