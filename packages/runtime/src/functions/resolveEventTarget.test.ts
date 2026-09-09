// @vitest-environment jsdom
import { beforeEach, describe, expect, test } from "vitest";
import { resolveEventTarget } from "./resolveEventTarget";
import {
  __resetShadowRootsForTesting,
  installShadowRootTracking,
} from "./shadowRoots";

/**
 * jsdom dispatches real events, so `composedPath()` behaves like a browser's.
 * Layout is not implemented, so the closed-root drill-down needs stubs for both
 * `elementFromPoint` and the host's box.
 */
function stubBox(element: Element) {
  element.getBoundingClientRect = () =>
    ({ left: 0, top: 0, right: 100, bottom: 100 } as DOMRect);
}
function dispatchAndResolve(target: Element, init: MouseEventInit = {}) {
  let resolved: HTMLElement | null | undefined;
  const listener = (event: Event) => {
    resolved = resolveEventTarget(event as MouseEvent);
  };
  document.addEventListener("click", listener, { capture: true });
  target.dispatchEvent(
    new MouseEvent("click", { bubbles: true, composed: true, ...init })
  );
  document.removeEventListener("click", listener, { capture: true });
  return resolved;
}

beforeEach(() => {
  document.body.innerHTML = "";
  __resetShadowRootsForTesting();
});

describe("resolveEventTarget", () => {
  test("returns the element itself for light DOM", () => {
    document.body.innerHTML = `<div id="a"><span id="b"></span></div>`;
    const span = document.getElementById("b")!;

    expect(dispatchAndResolve(span)).toBe(span);
  });

  test("looks through an open shadow boundary instead of stopping at the host", () => {
    const hostElement = document.createElement("div");
    document.body.appendChild(hostElement);
    const shadow = hostElement.attachShadow({ mode: "open" });
    const inner = document.createElement("span");
    shadow.appendChild(inner);

    const event = new MouseEvent("click", { bubbles: true, composed: true });
    let retargeted: EventTarget | null = null;
    let resolved: HTMLElement | null = null;
    document.addEventListener(
      "click",
      (e) => {
        retargeted = e.target;
        resolved = resolveEventTarget(e as MouseEvent);
      },
      { capture: true, once: true }
    );
    inner.dispatchEvent(event);

    // The browser retargets `target` to the host; we want the real element.
    expect(retargeted).toBe(hostElement);
    expect(resolved).toBe(inner);
  });

  test("looks through nested open shadow boundaries", () => {
    const outerHost = document.createElement("div");
    document.body.appendChild(outerHost);
    const outerShadow = outerHost.attachShadow({ mode: "open" });
    const innerHost = document.createElement("div");
    outerShadow.appendChild(innerHost);
    const innerShadow = innerHost.attachShadow({ mode: "open" });
    const leaf = document.createElement("span");
    innerShadow.appendChild(leaf);

    expect(dispatchAndResolve(leaf)).toBe(leaf);
  });

  test("drills into a closed shadow root using the pointer position", () => {
    installShadowRootTracking();

    const hostElement = document.createElement("div");
    document.body.appendChild(hostElement);
    const shadow = hostElement.attachShadow({ mode: "closed" });
    const inner = document.createElement("span");
    shadow.appendChild(inner);
    stubBox(hostElement);
    (
      shadow as ShadowRoot & {
        elementFromPoint: (x: number, y: number) => Element;
      }
    ).elementFromPoint = () => inner;

    // A closed root truncates the composed path at the host.
    expect(dispatchAndResolve(inner, { clientX: 5, clientY: 5 })).toBe(inner);
  });

  test("returns the host when a closed root has nothing at that point", () => {
    installShadowRootTracking();

    const hostElement = document.createElement("div");
    document.body.appendChild(hostElement);
    const shadow = hostElement.attachShadow({ mode: "closed" });
    const inner = document.createElement("span");
    shadow.appendChild(inner);
    stubBox(hostElement);
    (
      shadow as ShadowRoot & {
        elementFromPoint: (x: number, y: number) => Element | null;
      }
    ).elementFromPoint = () => null;

    expect(dispatchAndResolve(inner, { clientX: 5, clientY: 5 })).toBe(
      hostElement
    );
  });

  test("returns null for non-HTML targets", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    document.body.appendChild(svg);

    expect(dispatchAndResolve(svg)).toBe(null);
  });
});
