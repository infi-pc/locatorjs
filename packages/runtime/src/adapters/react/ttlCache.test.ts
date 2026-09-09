import { afterEach, describe, expect, test, vi } from "vitest";
import { createTtlCache } from "./ttlCache";

afterEach(() => {
  vi.useRealTimers();
});

describe("createTtlCache", () => {
  test("returns a live value", () => {
    const cache = createTtlCache<string>(1000, 10);
    cache.set("a", "1");

    expect(cache.get("a")).toBe("1");
    expect(cache.has("a")).toBe(true);
  });

  test("forgets a value once its TTL passes", () => {
    // Dev chunk URLs are stable across HMR, so without expiry a click after an
    // edit keeps resolving against pre-edit text.
    vi.useFakeTimers();
    const cache = createTtlCache<string>(1000, 10);
    cache.set("a", "1");

    vi.advanceTimersByTime(1001);

    expect(cache.get("a")).toBeUndefined();
    expect(cache.has("a")).toBe(false);
    expect(cache.size).toBe(0);
  });

  test("evicts the oldest entry past the cap", () => {
    // These hold whole JS bundles; one unresolvable click used to pin the text
    // of every script on the page for the lifetime of the tab.
    const cache = createTtlCache<string>(10_000, 2);
    cache.set("a", "1");
    cache.set("b", "2");
    cache.set("c", "3");

    expect(cache.size).toBe(2);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("c")).toBe("3");
  });

  test("re-setting a key refreshes its position, not just its value", () => {
    const cache = createTtlCache<string>(10_000, 2);
    cache.set("a", "1");
    cache.set("b", "2");
    cache.set("a", "1b");
    cache.set("c", "3");

    expect(cache.get("a")).toBe("1b");
    expect(cache.get("b")).toBeUndefined();
  });

  test("clear drops everything ahead of the TTL", () => {
    const cache = createTtlCache<string>(10_000, 10);
    cache.set("a", "1");

    cache.clear();

    expect(cache.size).toBe(0);
    expect(cache.get("a")).toBeUndefined();
  });

  test("stores a falsy value without confusing it for a miss", () => {
    const cache = createTtlCache<string>(1000, 10);
    cache.set("a", "");

    expect(cache.has("a")).toBe(true);
    expect(cache.get("a")).toBe("");
  });
});
