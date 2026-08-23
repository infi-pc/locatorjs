import { describe, expect, test } from "vitest";
import {
  cleanStackFileName,
  firstUserFrame,
  isInternalFrame,
  isLocatorFrame,
  parseStackFrame,
} from "./stackFrame";

describe("parseStackFrame - forms that used to fail entirely", () => {
  // The old regexes matched the filename with `([^:]+)`, which cannot match a
  // scheme-prefixed name. Every one of these returned null, so the React 19
  // Server Components strategy was dead code for real input.
  test("React Server Components frame", () => {
    expect(
      parseStackFrame(
        "    at Page (about://React/Server/file:///Users/me/app/page.tsx:5:3)"
      )
    ).toMatchObject({
      fileName: "/Users/me/app/page.tsx",
      lineNumber: 5,
      columnNumber: 3,
      functionName: "Page",
    });
  });

  test("http chunk URL", () => {
    expect(
      parseStackFrame(
        "    at Page (http://localhost:3000/_next/static/chunks/app/page.js:12:5)"
      )
    ).toMatchObject({
      fileName: "http://localhost:3000/_next/static/chunks/app/page.js",
      lineNumber: 12,
      columnNumber: 5,
    });
  });

  test("webpack-internal URL, parens and all", () => {
    expect(
      parseStackFrame(
        "    at Page (webpack-internal:///(app-pages-browser)/./app/page.js:12:5)"
      )
    ).toMatchObject({
      fileName: "webpack-internal:///(app-pages-browser)/./app/page.js",
      lineNumber: 12,
      columnNumber: 5,
    });
  });

  test("Firefox form", () => {
    expect(
      parseStackFrame("Page@http://localhost:3000/app/page.js:12:5")
    ).toMatchObject({
      fileName: "http://localhost:3000/app/page.js",
      lineNumber: 12,
      columnNumber: 5,
      functionName: "Page",
    });
  });
});

describe("parseStackFrame - other shapes", () => {
  test("plain absolute path", () => {
    expect(
      parseStackFrame("    at Page (/Users/me/app/page.tsx:5:3)")
    ).toMatchObject({ fileName: "/Users/me/app/page.tsx", lineNumber: 5 });
  });

  test("Windows drive letter", () => {
    expect(
      parseStackFrame("    at Page (C:\\\\Users\\\\me\\\\app\\\\page.tsx:5:3)")
    ).toMatchObject({
      fileName: "C:\\\\Users\\\\me\\\\app\\\\page.tsx",
      lineNumber: 5,
      columnNumber: 3,
    });
  });

  test("anonymous frame with no function name", () => {
    expect(parseStackFrame("    at /Users/me/app/page.tsx:5:3")).toMatchObject({
      fileName: "/Users/me/app/page.tsx",
      functionName: "<unknown>",
    });
  });

  test("keeps the raw name for the Next dev-server API", () => {
    const frame = parseStackFrame(
      "    at Page (about://React/Server/file:///Users/me/app/page.tsx:5:3)"
    );
    expect(frame?.rawFileName).toBe(
      "about://React/Server/file:///Users/me/app/page.tsx"
    );
  });

  test("rejects a line with no position", () => {
    expect(parseStackFrame("Error: something went wrong")).toBeNull();
    expect(parseStackFrame("")).toBeNull();
  });
});

describe("cleanStackFileName", () => {
  test("strips the RSC scheme and the file:// prefix", () => {
    expect(
      cleanStackFileName("about://React/Server/file:///Users/me/a.tsx")
    ).toBe("/Users/me/a.tsx");
  });

  test("drops a Turbopack chunk query", () => {
    expect(cleanStackFileName("/_next/static/chunks/app.js?5")).toBe(
      "/_next/static/chunks/app.js"
    );
  });
});

describe("isInternalFrame", () => {
  test("catches React's JSX dev runtime", () => {
    // The old marker list had neither `react.` nor `jsxDEV` matching this
    // name, so React's own runtime was returned as the component's source --
    // the cause of an intermittent e2e failure on the Turbopack app.
    expect(
      isInternalFrame(
        "/app/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js"
      )
    ).toBe(true);
  });

  test("catches anything under node_modules", () => {
    expect(isInternalFrame("/app/node_modules/some-lib/index.js")).toBe(true);
  });

  test("leaves user source alone", () => {
    expect(isInternalFrame("/app/src/components/Button.tsx")).toBe(false);
  });
});

describe("isLocatorFrame", () => {
  test("matches LocatorJS's own bundles", () => {
    expect(isLocatorFrame("/app/node_modules/@locator/runtime/dist/x.js")).toBe(
      true
    );
    expect(isLocatorFrame("chrome-extension://abc/locatorjs-client.js")).toBe(
      true
    );
  });

  test("does not swallow a user project that happens to be called locator", () => {
    // `fileName.includes("locator")` filtered out every frame belonging to a
    // developer working in /projects/locator-admin.
    expect(isLocatorFrame("/projects/locator-admin/src/Button.tsx")).toBe(
      false
    );
  });
});

describe("firstUserFrame", () => {
  test("skips React internals and returns the app frame", () => {
    const stack = [
      "Error",
      "    at react_stack_bottom_frame (/app/node_modules/react-dom/index.js:1:1)",
      "    at Card (/app/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js:20:1)",
      "    at Card (/app/src/Card.tsx:7:3)",
    ].join("\n");

    expect(firstUserFrame(stack)).toMatchObject({
      fileName: "/app/src/Card.tsx",
      lineNumber: 7,
    });
  });

  test("returns null when every frame is internal", () => {
    const stack = [
      "Error",
      "    at x (/app/node_modules/react-dom/index.js:1:1)",
    ].join("\n");

    expect(firstUserFrame(stack)).toBeNull();
  });
});
