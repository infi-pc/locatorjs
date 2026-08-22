// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from "vitest";
import {
  broadcastModifiers,
  listenToFrameModifiers,
  modifiersFromEvent,
} from "./crossFrameModifiers";

const cleanups: (() => void)[] = [];

afterEach(() => {
  while (cleanups.length) cleanups.pop()!();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

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
