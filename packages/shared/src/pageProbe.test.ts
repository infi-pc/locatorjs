/**
 * These tests render the real frameworks into jsdom rather than planting fake
 * markers, so they pin the probe to what react-dom, vue and svelte actually
 * put on DOM nodes in their development and production builds.
 */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { createApp, h } from "vue";
import { chooseAdapter, probePage, type PageProbe } from "./pageProbe";

// Vitest runs with the package directory as cwd; `import.meta` is not
// available under this package's tsconfig module setting.
const require = createRequire(join(process.cwd(), "package.json"));

type ReactDomProd = {
  createRoot: typeof createRoot;
  flushSync: typeof flushSync;
};
// The production bundle is not in react-dom's exports map, so resolve it by path.
const reactDomProd: ReactDomProd = require(join(
  dirname(require.resolve("react-dom/package.json")),
  "cjs/react-dom.production.min.js"
));
type VueProd = { createApp: typeof createApp; h: typeof h };
// The CommonJS prod entry still resolves @vue/runtime-core through NODE_ENV,
// which is "test" here, and shares the renderer singleton with the dev import.
// The self-contained IIFE bundle is the real production runtime.
const vueProd: VueProd = new Function(
  `${readFileSync(
    require.resolve("vue/dist/vue.runtime.global.prod.js"),
    "utf8"
  )}; return Vue;`
)();
const svelteCompiler: {
  compile: (
    source: string,
    options: { dev: boolean; format: "cjs"; filename: string }
  ) => { js: { code: string } };
} = require("svelte/compiler");

function mount(html = "") {
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container);
  return container;
}

function evidence(probe: PageProbe, id: string) {
  return probe.frameworks.find((entry) => entry.id === id);
}

function renderReactDev(container: HTMLElement) {
  flushSync(() => {
    createRoot(container).render(createElement("h1", null, "Vite + React"));
  });
}

function renderReactProd(container: HTMLElement) {
  reactDomProd.flushSync(() => {
    reactDomProd
      .createRoot(container)
      .render(createElement("h1", null, "Vite + React"));
  });
}

const SVELTE_SOURCE = `
<h1 class="title">Vite + Svelte</h1>
<style>.title { color: red; }</style>
`;

function renderSvelte(container: HTMLElement, dev: boolean) {
  const { js } = svelteCompiler.compile(SVELTE_SOURCE, {
    dev,
    format: "cjs",
    filename: "App.svelte",
  });
  const module = { exports: {} as { default: new (options: object) => void } };
  new Function("require", "module", "exports", js.code)(
    require,
    module,
    module.exports
  );
  new module.exports.default({ target: container });
}

afterEach(() => {
  document.body.innerHTML = "";
  delete (globalThis as Record<string, unknown>).__VUE__;
  delete (window as unknown as Record<string, unknown>).__VUE__;
});

describe("probePage", () => {
  test("empty document reports nothing and not rendered", () => {
    const probe = probePage();
    expect(probe).toEqual({ frameworks: [], unsupported: [], rendered: false });
  });

  test("React development build: present with source info", () => {
    renderReactDev(mount());
    const probe = probePage();
    expect(evidence(probe, "react")).toEqual({
      id: "react",
      present: true,
      sourceInfo: true,
    });
    expect(probe.rendered).toBe(true);
    expect(chooseAdapter(probe)).toBe("react");
  });

  test("React production build: present without source info", () => {
    renderReactProd(mount());
    const probe = probePage();
    expect(evidence(probe, "react")).toEqual({
      id: "react",
      present: true,
      sourceInfo: false,
    });
    expect(chooseAdapter(probe)).toBeNull();
  });

  test("Vue development build: present with source info", () => {
    createApp({ render: () => h("h1", "Vite + Vue") }).mount(mount());
    const probe = probePage();
    expect(evidence(probe, "vue")).toEqual({
      id: "vue",
      present: true,
      sourceInfo: true,
    });
    expect(chooseAdapter(probe)).toBe("vue");
  });

  test("Vue production build: __VUE__ is set but nodes carry no metadata", () => {
    vueProd
      .createApp({ render: () => vueProd.h("h1", "Vite + Vue") })
      .mount(mount());
    expect((globalThis as Record<string, unknown>).__VUE__).toBe(true);
    const probe = probePage();
    expect(evidence(probe, "vue")).toEqual({
      id: "vue",
      present: true,
      sourceInfo: false,
    });
    expect(chooseAdapter(probe)).toBeNull();
  });

  test("Svelte compiled with dev: true: present with source info", () => {
    renderSvelte(mount(), true);
    const probe = probePage();
    expect(evidence(probe, "svelte")).toEqual({
      id: "svelte",
      present: true,
      sourceInfo: true,
    });
    expect(chooseAdapter(probe)).toBe("svelte");
  });

  test("Svelte production compile: scoped class hints presence only", () => {
    renderSvelte(mount(), false);
    const probe = probePage();
    expect(evidence(probe, "svelte")).toEqual({
      id: "svelte",
      present: true,
      sourceInfo: false,
    });
    expect(chooseAdapter(probe)).toBeNull();
  });

  test("babel-jsx attributes count as explicit instrumentation", () => {
    mount('<div data-locatorjs-id="src/App.tsx::1">Hi</div>');
    const probe = probePage();
    expect(evidence(probe, "jsx")).toEqual({
      id: "jsx",
      present: true,
      sourceInfo: true,
    });
    expect(chooseAdapter(probe)).toBe("jsx");
  });

  test("explicit instrumentation wins over an inferred React adapter", () => {
    renderReactDev(mount());
    mount('<div data-locatorjs="src/App.tsx::1::2">Hi</div>');
    const probe = probePage();
    expect(probe.frameworks.map((entry) => entry.id).sort()).toEqual([
      "jsx",
      "react",
    ]);
    expect(chooseAdapter(probe)).toBe("jsx");
  });

  test("names unsupported frameworks for the popup copy", () => {
    mount('<app-root ng-version="18.0.0">Hi</app-root>');
    const probe = probePage();
    expect(probe.frameworks).toEqual([]);
    expect(probe.unsupported).toEqual(["Angular"]);
    expect(probe.rendered).toBe(true);
  });

  test("respects the sampling limit", () => {
    const filler = mount();
    for (let index = 0; index < 50; index++) {
      filler.appendChild(document.createElement("span"));
    }
    renderReactDev(mount());
    expect(
      evidence(probePage(document, { limit: 20 }), "react")
    ).toBeUndefined();
    expect(
      evidence(probePage(document, { limit: 200 }), "react")
    ).toBeDefined();
  });

  test("samples supplied shadow roots", () => {
    const host = mount();
    const shadow = host.attachShadow({ mode: "closed" });
    const container = document.createElement("div");
    shadow.appendChild(container);
    renderReactDev(container);
    expect(evidence(probePage(), "react")).toBeUndefined();
    expect(
      evidence(probePage(document, { roots: [shadow] }), "react")
    ).toBeDefined();
  });
});
