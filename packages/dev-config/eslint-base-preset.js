module.exports = {
  parser: "@typescript-eslint/parser",
  extends: ["prettier", "eslint:recommended"],
  rules: {
    "no-console": ["error", { allow: ["error", "info"] }],
    "no-unused-vars": ["warn"],
  },
};
