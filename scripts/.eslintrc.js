module.exports = {
  root: true,
  extends: ["../packages/dev-config/eslint-base-preset.js"],
  env: {
    es2022: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "script",
  },
  rules: {
    "@typescript-eslint/no-var-requires": "off",
  },
};
