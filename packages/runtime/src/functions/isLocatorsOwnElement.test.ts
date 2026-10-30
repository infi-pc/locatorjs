// @vitest-environment jsdom
import { beforeEach, describe, expect, test } from "vitest";
import { isLocatorsOwnElement } from "./isLocatorsOwnElement";

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("isLocatorsOwnElement", () => {
  test("recognises the wrapper and its light-DOM descendants", () => {
    document.body.innerHTML = `<div id="locatorjs-wrapper"><span id="inside"></span></div>`;

    expect(
      isLocatorsOwnElement(document.getElementById("locatorjs-wrapper")!)
    ).toBe(true);
    expect(isLocatorsOwnElement(document.getElementById("inside")!)).toBe(true);
  });

  test("recognises elements inside the wrapper's shadow root", () => {
    const wrapper = document.createElement("div");
    wrapper.id = "locatorjs-wrapper";
    document.body.appendChild(wrapper);
    const shadow = wrapper.attachShadow({ mode: "open" });
    const layer = document.createElement("div");
    layer.id = "locatorjs-layer";
    shadow.appendChild(layer);
    const button = document.createElement("button");
    layer.appendChild(button);

    // The button has no `#locatorjs-wrapper` ancestor inside its own tree.
    expect(button.matches("#locatorjs-wrapper *")).toBe(false);
    expect(isLocatorsOwnElement(button)).toBe(true);
  });

  test("does not claim page elements that live in their own shadow root", () => {
    const pageHost = document.createElement("div");
    document.body.appendChild(pageHost);
    const shadow = pageHost.attachShadow({ mode: "open" });
    const inner = document.createElement("span");
    shadow.appendChild(inner);

    expect(isLocatorsOwnElement(inner)).toBe(false);
  });

  test("does not claim ordinary page elements", () => {
    document.body.innerHTML = `<div id="page"></div>`;

    expect(isLocatorsOwnElement(document.getElementById("page")!)).toBe(false);
  });
});
