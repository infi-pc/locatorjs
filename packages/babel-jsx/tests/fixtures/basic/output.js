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
    window.__locatorData = window.__locatorData || [];

    window.__locatorData.push({
      filePath: "/tests/fixtures/basic/code.js",
      projectPath: "/Users/michaelmusil/www/locatorjs/packages/babel-jsx",
      nextId: 1,
      expressions: [
        {
          type: "jsx",
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
          wrappingComponent: null,
        },
      ],
    });
  }
})();
