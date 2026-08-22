// @vitest-environment jsdom
import { beforeEach, describe, expect, test } from "vitest";
import {
  closestAcrossShadow,
  getParentElementAcrossShadow,
} from "./domTraversal";

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("getParentElementAcrossShadow", () => {
  test("returns the light-DOM parent when there is one", () => {
    document.body.innerHTML = `<div id="parent"><span id="child"></span></div>`;
    const child = document.getElementById("child")!;

    expect(getParentElementAcrossShadow(child)).toBe(
      document.getElementById("parent")
    );
  });

  test("steps out of a shadow root through its host", () => {
    const host = document.createElement("div");
    host.id = "host";
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: "open" });
    const inner = document.createElement("span");
    shadow.appendChild(inner);

    expect(inner.parentElement).toBe(null);
    expect(getParentElementAcrossShadow(inner)).toBe(host);
  });

  test("returns null at the top of the document", () => {
    expect(getParentElementAcrossShadow(document.documentElement)).toBe(null);
  });
});

describe("closestAcrossShadow", () => {
  test("finds a match inside the same tree", () => {
    document.body.innerHTML = `<div data-locatorjs="a"><span id="child"></span></div>`;
    const child = document.getElementById("child")!;

    expect(closestAcrossShadow(child, "[data-locatorjs]")).toBe(
      document.querySelector("[data-locatorjs]")
    );
  });

  test("finds a match outside the shadow boundary", () => {
    document.body.innerHTML = `<div data-locatorjs="a"><div id="host"></div></div>`;
    const host = document.getElementById("host")!;
    const shadow = host.attachShadow({ mode: "open" });
    const inner = document.createElement("span");
    shadow.appendChild(inner);

    expect(inner.closest("[data-locatorjs]")).toBe(null);
    expect(closestAcrossShadow(inner, "[data-locatorjs]")).toBe(
      document.querySelector("[data-locatorjs]")
    );
  });

  test("crosses several nested shadow boundaries", () => {
    document.body.innerHTML = `<div data-locatorjs="a"><div id="outer"></div></div>`;
    const outerHost = document.getElementById("outer")!;
    const outerShadow = outerHost.attachShadow({ mode: "open" });
    const innerHost = document.createElement("div");
    outerShadow.appendChild(innerHost);
    const innerShadow = innerHost.attachShadow({ mode: "open" });
    const leaf = document.createElement("span");
    innerShadow.appendChild(leaf);

    expect(closestAcrossShadow(leaf, "[data-locatorjs]")).toBe(
      document.querySelector("[data-locatorjs]")
    );
  });

  test("returns null when nothing matches", () => {
    document.body.innerHTML = `<div><span id="child"></span></div>`;
    const child = document.getElementById("child")!;

    expect(closestAcrossShadow(child, "[data-locatorjs]")).toBe(null);
  });
});
