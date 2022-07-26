module.exports = {
  parser: "@typescript-eslint/parser",
  extends: [
    "prettier",
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  rules: {
    "no-console": ["error", { allow: ["error", "info"] }],
    "@typescript-eslint/no-unused-vars": ["warn"],
    "@typescript-eslint/no-explicit-any": ["off"],
  },
};
