// @vitest-environment jsdom
import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  __resetShadowRootsForTesting,
  getShadowRootOf,
  getShadowRoots,
  installShadowRootTracking,
  listenForShadowRootScrolls,
  observeShadowRoots,
  setPointerCursorInShadowRoots,
} from "./shadowRoots";

function host() {
  const element = document.createElement("div");
  document.body.appendChild(element);
  return element;
}

function isStyled(root: ShadowRoot) {
  return (
    (root.adoptedStyleSheets?.length ?? 0) > 0 ||
    !!root.getElementById("locatorjs-shadow-cursor")
  );
}

beforeEach(() => {
  document.body.innerHTML = "";
  __resetShadowRootsForTesting();
});

describe("shadow root registry", () => {
  test("finds open shadow roots that already exist", () => {
    const shadow = host().attachShadow({ mode: "open" });

    installShadowRootTracking();

    expect(getShadowRoots()).toContain(shadow);
  });

  test("finds nested shadow roots the document walk cannot reach", () => {
    const outerShadow = host().attachShadow({ mode: "open" });
    const innerHost = document.createElement("div");
    outerShadow.appendChild(innerHost);
    const innerShadow = innerHost.attachShadow({ mode: "open" });

    installShadowRootTracking();

    expect(getShadowRoots()).toContain(outerShadow);
    expect(getShadowRoots()).toContain(innerShadow);
  });

  test("picks up shadow roots attached after tracking started", () => {
    installShadowRootTracking();

    const shadow = host().attachShadow({ mode: "open" });

    expect(getShadowRoots()).toContain(shadow);
  });

  test("records closed shadow roots so they can be looked up by host", () => {
    installShadowRootTracking();

    const element = host();
    const shadow = element.attachShadow({ mode: "closed" });

    expect(element.shadowRoot).toBe(null);
    expect(getShadowRootOf(element)).toBe(shadow);
  });

  test("ignores Locator's own shadow root", () => {
    installShadowRootTracking();

    const wrapper = host();
    wrapper.id = "locatorjs-wrapper";
    const shadow = wrapper.attachShadow({ mode: "open" });

    expect(getShadowRoots()).not.toContain(shadow);
  });

  test("attachShadow keeps returning the native root", () => {
    installShadowRootTracking();

    const element = host();
    const shadow = element.attachShadow({ mode: "open" });

    expect(shadow).toBe(element.shadowRoot);
    expect(shadow.host).toBe(element);
  });

  test("notifies subscribers about existing and future roots", () => {
    const existing = host().attachShadow({ mode: "open" });

    const seen: ShadowRoot[] = [];
    const stop = observeShadowRoots((root) => seen.push(root));
    expect(seen).toContain(existing);

    const late = host().attachShadow({ mode: "open" });
    expect(seen).toContain(late);

    stop();
    const after = host().attachShadow({ mode: "open" });
    expect(seen).not.toContain(after);
  });

  test("drops scroll listeners when a shadow host is detached", async () => {
    const element = host();
    const shadow = element.attachShadow({ mode: "open" });
    const remove = vi.spyOn(shadow, "removeEventListener");
    const stop = listenForShadowRootScrolls(() => undefined);

    element.remove();
    await Promise.resolve();

    expect(remove).toHaveBeenCalledWith("scroll", expect.any(Function), {
      capture: true,
    });
    stop();
  });
});

describe("pointer cursor", () => {
  test("adds and removes the cursor rule in every shadow root", () => {
    installShadowRootTracking();
    const shadow = host().attachShadow({ mode: "open" });

    expect(isStyled(shadow)).toBe(false);
    setPointerCursorInShadowRoots(true);
    expect(isStyled(shadow)).toBe(true);
    setPointerCursorInShadowRoots(false);
    expect(isStyled(shadow)).toBe(false);
  });

  test("styles shadow roots created while the cursor is active", () => {
    installShadowRootTracking();
    setPointerCursorInShadowRoots(true);

    const shadow = host().attachShadow({ mode: "open" });

    expect(isStyled(shadow)).toBe(true);
  });
});
