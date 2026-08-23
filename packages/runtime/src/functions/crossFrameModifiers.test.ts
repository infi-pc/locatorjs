// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from "vitest";
import {
  broadcastModifiers,
  listenToFrameModifiers,
  modifiersFromEvent,
} from "./crossFrameModifiers";
import {
  __resetShadowRootsForTesting,
  installShadowRootTracking,
} from "./shadowRoots";

const cleanups: (() => void)[] = [];

afterEach(() => {
  while (cleanups.length) cleanups.pop()!();
  document.body.innerHTML = "";
  __resetShadowRootsForTesting();
  vi.restoreAllMocks();
});

/** An iframe whose contentWindow records what it was posted. */
function frameIn(parent: ParentNode & Node) {
  const frame = document.createElement("iframe");
  parent.appendChild(frame);
  const post = vi.fn();
  Object.defineProperty(frame, "contentWindow", {
    value: { postMessage: post },
  });
  return post;
}

function listen(onModifiers: (state: unknown) => void) {
  const stop = listenToFrameModifiers(onModifiers);
  cleanups.push(stop);
}

function messageFrom(source: unknown, data: unknown) {
  const event = new MessageEvent("message", { data });
  Object.defineProperty(event, "source", { value: source });
  window.dispatchEvent(event);
}

describe("modifiersFromEvent", () => {
  test("picks out only the modifier flags", () => {
    const event = new KeyboardEvent("keydown", { key: "a", altKey: true });

    expect(modifiersFromEvent(event)).toEqual({
      altKey: true,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
    });
  });
});

describe("broadcastModifiers", () => {
  test("posts to the child frames of this document", () => {
    const frame = document.createElement("iframe");
    document.body.appendChild(frame);
    const post = vi.fn();
    Object.defineProperty(frame, "contentWindow", {
      value: { postMessage: post },
    });

    broadcastModifiers({
      altKey: true,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
    });

    expect(post).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "LOCATOR_FRAME_MODIFIERS",
        altKey: true,
        hops: 0,
      }),
      "*"
    );
  });

  test("reaches an iframe inside a shadow root", () => {
    // `document.querySelectorAll` never crosses a shadow boundary, so this
    // frame heard nothing and its overlay stayed dark while the light-DOM one
    // next to it worked.
    const host = document.createElement("div");
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: "open" });

    const inLightDom = frameIn(document.body);
    const inShadow = frameIn(shadow);

    broadcastModifiers({
      altKey: true,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
    });

    expect(inLightDom).toHaveBeenCalledTimes(1);
    expect(inShadow).toHaveBeenCalledTimes(1);
  });

  test("reaches an iframe inside a nested shadow root", () => {
    // A closed root is only ever seen by the `attachShadow` patch, so tracking
    // has to be installed before it is attached -- as the runtime does.
    installShadowRootTracking();
    const outerHost = document.createElement("div");
    document.body.appendChild(outerHost);
    const outer = outerHost.attachShadow({ mode: "open" });
    const innerHost = document.createElement("div");
    outer.appendChild(innerHost);
    const inner = innerHost.attachShadow({ mode: "closed" });

    const post = frameIn(inner);

    broadcastModifiers({
      altKey: true,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
    });

    expect(post).toHaveBeenCalledTimes(1);
  });

  test("survives a frame that refuses postMessage", () => {
    const frame = document.createElement("iframe");
    document.body.appendChild(frame);
    Object.defineProperty(frame, "contentWindow", {
      value: {
        postMessage: () => {
          throw new Error("cross-origin");
        },
      },
    });

    expect(() =>
      broadcastModifiers({
        altKey: true,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
      })
    ).not.toThrow();
  });
});

describe("listenToFrameModifiers", () => {
  test("reports modifier state coming from another frame", () => {
    const onModifiers = vi.fn();
    listen(onModifiers);

    messageFrom(
      {},
      {
        type: "LOCATOR_FRAME_MODIFIERS",
        altKey: true,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        hops: 0,
      }
    );

    expect(onModifiers).toHaveBeenCalledWith({
      altKey: true,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
    });
  });

  test("ignores messages this window sent itself", () => {
    const onModifiers = vi.fn();
    listen(onModifiers);

    messageFrom(window, {
      type: "LOCATOR_FRAME_MODIFIERS",
      altKey: true,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      hops: 0,
    });

    expect(onModifiers).not.toHaveBeenCalled();
  });

  test("ignores unrelated or malformed messages", () => {
    const onModifiers = vi.fn();
    listen(onModifiers);

    messageFrom({}, { type: "SOMETHING_ELSE", altKey: true });
    messageFrom({}, { type: "LOCATOR_FRAME_MODIFIERS", altKey: "yes" });
    messageFrom({}, "LOCATOR_FRAME_MODIFIERS");
    messageFrom({}, null);

    expect(onModifiers).not.toHaveBeenCalled();
  });

  test("forwards one hop further but never back to the sender", () => {
    const senderPost = vi.fn();
    const sender = { postMessage: senderPost };
    const otherPost = vi.fn();
    const frame = document.createElement("iframe");
    document.body.appendChild(frame);
    Object.defineProperty(frame, "contentWindow", {
      value: { postMessage: otherPost },
    });

    listen(() => undefined);
    messageFrom(sender, {
      type: "LOCATOR_FRAME_MODIFIERS",
      altKey: true,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      hops: 0,
    });

    expect(otherPost).toHaveBeenCalledWith(
      expect.objectContaining({ hops: 1, altKey: true }),
      "*"
    );
    expect(senderPost).not.toHaveBeenCalled();
  });

  test("stops forwarding once the hop limit is reached", () => {
    const otherPost = vi.fn();
    const frame = document.createElement("iframe");
    document.body.appendChild(frame);
    Object.defineProperty(frame, "contentWindow", {
      value: { postMessage: otherPost },
    });

    const onModifiers = vi.fn();
    listen(onModifiers);
    messageFrom(
      {},
      {
        type: "LOCATOR_FRAME_MODIFIERS",
        altKey: true,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        hops: 8,
      }
    );

    expect(onModifiers).toHaveBeenCalled();
    expect(otherPost).not.toHaveBeenCalled();
  });

  test("cleanup removes the listener", () => {
    const onModifiers = vi.fn();
    const stop = listenToFrameModifiers(onModifiers);
    stop();

    messageFrom(
      {},
      {
        type: "LOCATOR_FRAME_MODIFIERS",
        altKey: true,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        hops: 0,
      }
    );

    expect(onModifiers).not.toHaveBeenCalled();
  });
});
