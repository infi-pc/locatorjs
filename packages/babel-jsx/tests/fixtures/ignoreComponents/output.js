export default () => {
  return (
    <>
      <Aa
        data-locatorjs-id={
          "/babel-jsx/tests/fixtures/ignoreComponents/code.js::0"
        }
      ></Aa>
      <Bb></Bb>
    </>
  );
};
(() => {
  if (typeof window !== "undefined") {
    window.__LOCATOR_DATA__ = window.__LOCATOR_DATA__ || {};
    window.__LOCATOR_DATA__[
      "/babel-jsx/tests/fixtures/ignoreComponents/code.js"
    ] = {
      filePath: "/tests/fixtures/ignoreComponents/code.js",
      projectPath: "/babel-jsx",
      expressions: [
        {
          name: "Aa",
          loc: {
            start: {
              line: 4,
              column: 6,
              index: 47,
            },
            end: {
              line: 4,
              column: 15,
              index: 56,
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
