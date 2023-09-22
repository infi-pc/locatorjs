import { template as _$template } from "solid-js/web";
import { className as _$className } from "solid-js/web";
import { effect as _$effect } from "solid-js/web";
import { setAttribute as _$setAttribute } from "solid-js/web";
const _tmpl$ = /*#__PURE__*/ _$template(
  `<div data-x="another-data-attribute" data-locatorjs-id="/babel-jsx/tests/fixtures/solid/code.js::0"><header data-locatorjs-id="/babel-jsx/tests/fixtures/solid/code.js::1"><img alt="logo" data-locatorjs-id="/babel-jsx/tests/fixtures/solid/code.js::2"><p data-locatorjs-id="/babel-jsx/tests/fixtures/solid/code.js::3">Edit <code data-locatorjs-id="/babel-jsx/tests/fixtures/solid/code.js::4">src/App.jsx</code> and save to reload.</p><a href="https://github.com/solidjs/solid" target="_blank" rel="noopener noreferrer" data-locatorjs-id="/babel-jsx/tests/fixtures/solid/code.js::5">Learn Solid`
);
import logo from "./logo.svg";
import styles from "./App.module.css";
function App() {
  return (() => {
    const _el$ = _tmpl$(),
      _el$2 = _el$.firstChild,
      _el$3 = _el$2.firstChild,
      _el$4 = _el$3.nextSibling,
      _el$5 = _el$4.nextSibling;
    _$setAttribute(_el$3, "src", logo);
    _$effect(
      (_p$) => {
        const _v$ = styles.App,
          _v$2 = styles.header,
          _v$3 = styles.logo,
          _v$4 = styles.link;
        _v$ !== _p$._v$ && _$className(_el$, (_p$._v$ = _v$));
        _v$2 !== _p$._v$2 && _$className(_el$2, (_p$._v$2 = _v$2));
        _v$3 !== _p$._v$3 && _$className(_el$3, (_p$._v$3 = _v$3));
        _v$4 !== _p$._v$4 && _$className(_el$5, (_p$._v$4 = _v$4));
        return _p$;
      },
      {
        _v$: undefined,
        _v$2: undefined,
        _v$3: undefined,
        _v$4: undefined,
      }
    );
    return _el$;
  })();
}
export default App;
(() => {
  if (typeof window !== "undefined") {
    window.__LOCATOR_DATA__ = window.__LOCATOR_DATA__ || {};
    window.__LOCATOR_DATA__["/babel-jsx/tests/fixtures/solid/code.js"] = {
      filePath: "/tests/fixtures/solid/code.js",
      projectPath: "/babel-jsx",
      expressions: [
        {
          name: "div",
          loc: {
            start: {
              line: 6,
              column: 4,
              index: 103,
            },
            end: {
              line: 21,
              column: 10,
              index: 566,
            },
          },
          wrappingComponentId: 0,
        },
        {
          name: "header",
          loc: {
            start: {
              line: 7,
              column: 6,
              index: 168,
            },
            end: {
              line: 20,
              column: 15,
              index: 555,
            },
          },
          wrappingComponentId: 0,
        },
        {
          name: "img",
          loc: {
            start: {
              line: 8,
              column: 8,
              index: 207,
            },
            end: {
              line: 8,
              column: 57,
              index: 256,
            },
          },
          wrappingComponentId: 0,
        },
        {
          name: "p",
          loc: {
            start: {
              line: 9,
              column: 8,
              index: 265,
            },
            end: {
              line: 11,
              column: 12,
              index: 341,
            },
          },
          wrappingComponentId: 0,
        },
        {
          name: "code",
          loc: {
            start: {
              line: 10,
              column: 15,
              index: 284,
            },
            end: {
              line: 10,
              column: 39,
              index: 308,
            },
          },
          wrappingComponentId: 0,
        },
        {
          name: "a",
          loc: {
            start: {
              line: 12,
              column: 8,
              index: 350,
            },
            end: {
              line: 19,
              column: 12,
              index: 539,
            },
          },
          wrappingComponentId: 0,
        },
      ],
      styledDefinitions: [],
      components: [
        {
          name: "App",
          locString: "4:0",
          loc: {
            start: {
              line: 4,
              column: 0,
              index: 71,
            },
            end: {
              line: 23,
              column: 1,
              index: 573,
            },
          },
        },
      ],
    };
  }
})();
