// eslint-disable-next-line no-undef
module.exports = (api) => {
  const isTest = api.env("test");
  return {
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
