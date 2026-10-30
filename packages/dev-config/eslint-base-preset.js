module.exports = {
  parser: "@typescript-eslint/parser",
  extends: [
    "prettier",
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  rules: {
    // console.warn is a legitimate diagnostic channel for a devtool that has to
    // tell users about unsupported setups it cannot do anything about.
    "no-console": ["error", { allow: ["error", "info", "warn"] }],
    "@typescript-eslint/no-unused-vars": ["warn"],
    "@typescript-eslint/no-explicit-any": ["off"],
  },
};
