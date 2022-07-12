export default () => {
  return (
    <Aaaa
      data-locatorjs-id={
        "/Users/michaelmusil/www/locatorjs/packages/babel-jsx/tests/fixtures/basic/code.js::0"
      }
    ></Aaaa>
  );
};

(() => {
  if (typeof window !== "undefined") {
    window.__LOCATOR_DATA__ = window.__LOCATOR_DATA__ || {};
    window.__LOCATOR_DATA__[
      "/Users/michaelmusil/www/locatorjs/packages/babel-jsx/tests/fixtures/basic/code.js"
    ] = {
      filePath: "/tests/fixtures/basic/code.js",
      projectPath: "/Users/michaelmusil/www/locatorjs/packages/babel-jsx",
      expressions: [
        {
          name: "Aaaa",
          loc: {
            start: {
              line: 2,
              column: 11,
              index: 34,
            },
            end: {
              line: 2,
              column: 24,
              index: 47,
            },
          },
          wrappingComponentId: null,
        },
      ],
      styledDefinitions: [],
      components: [],
    };
  }
})();
