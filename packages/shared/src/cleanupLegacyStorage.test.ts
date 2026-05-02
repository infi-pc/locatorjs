import { beforeEach, describe, expect, test } from "vitest";
import { cleanupLegacyLocalStorage } from "./cleanupLegacyStorage";

class MemoryLocalStorage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  key(i: number) {
    return Array.from(this.store.keys())[i] ?? null;
  }
  getItem(k: string) {
    return this.store.has(k) ? this.store.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.store.set(k, String(v));
  }
  removeItem(k: string) {
    this.store.delete(k);
  }
  clear() {
    this.store.clear();
  }
}

describe("cleanupLegacyLocalStorage", () => {
  beforeEach(() => {
    (globalThis as any).localStorage = new MemoryLocalStorage();
  });

  test("removes LOCATOR_OPTIONS when present", () => {
    localStorage.setItem("LOCATOR_OPTIONS", JSON.stringify({ foo: 1 }));
    cleanupLegacyLocalStorage();
    expect(localStorage.getItem("LOCATOR_OPTIONS")).toBeNull();
  });

  test("no-op when key absent", () => {
    expect(() => cleanupLegacyLocalStorage()).not.toThrow();
    expect(localStorage.getItem("LOCATOR_OPTIONS")).toBeNull();
  });

  test("idempotent on repeat calls", () => {
    localStorage.setItem("LOCATOR_OPTIONS", "x");
    cleanupLegacyLocalStorage();
    cleanupLegacyLocalStorage();
    cleanupLegacyLocalStorage();
    expect(localStorage.getItem("LOCATOR_OPTIONS")).toBeNull();
  });

  test("does not touch new LOCATOR_USER_OPTIONS key", () => {
    localStorage.setItem("LOCATOR_USER_OPTIONS", JSON.stringify({ a: 1 }));
    cleanupLegacyLocalStorage();
    expect(localStorage.getItem("LOCATOR_USER_OPTIONS")).toBe(
      JSON.stringify({ a: 1 })
    );
  });

  test("fail-soft when getItem throws", () => {
    (globalThis as any).localStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => undefined,
    };
    expect(() => cleanupLegacyLocalStorage()).not.toThrow();
  });

  test("no-op when localStorage absent", () => {
    (globalThis as any).localStorage = undefined;
    expect(() => cleanupLegacyLocalStorage()).not.toThrow();
  });
});
