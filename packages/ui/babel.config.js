// eslint-disable-next-line no-undef -- Babel loads this file as CommonJS.
module.exports = (api) => {
  const isTest = api.env("test");
  return {
    plugins: ["../../scripts/inline-image-imports.js"],
    presets: [
      [
        "@babel/preset-env",
        { targets: { node: "current" }, modules: isTest ? undefined : false },
      ],
      "@babel/preset-typescript",
      "solid",
    ],
  };
};
