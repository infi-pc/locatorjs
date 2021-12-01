export default () => {
  return <Aaaa data-locatorjs-id={"0"}></Aaaa>;
};

require("locatorjs/dist/runtime.js").register({
  path: "/Users/michaelmusil/www/templates/locatorjs/tests/fixtures/basic/code.js",
  nextId: 1,
  expressions: [
    {
      name: "Aaaa",
      loc: {
        start: {
          line: 2,
          column: 11,
        },
        end: {
          line: 2,
          column: 24,
        },
      },
    },
  ],
});
