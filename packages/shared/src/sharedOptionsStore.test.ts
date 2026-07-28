import { beforeEach, describe, expect, test } from "vitest";
import {
  clearUserOriginOptions,
  USER_ORIGIN_STORAGE_KEY,
} from "./sharedOptionsStore";

class MemoryLocalStorage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  key(i: number) {
    return Array.from(this.store.keys())[i] ?? null;
  }
  getItem(k: string) {
    return this.store.get(k) ?? null;
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

describe("clearUserOriginOptions", () => {
  beforeEach(() => {
    (globalThis as { localStorage?: Storage }).localStorage =
      new MemoryLocalStorage() as Storage;
  });

  test("clears options while preserving non-empty uiState", () => {
    localStorage.setItem(
      USER_ORIGIN_STORAGE_KEY,
      JSON.stringify({
        projectPath: "/repo",
        mouseModifiers: "ctrl",
        uiState: { welcomeScreenDismissed: true },
      })
    );

    clearUserOriginOptions();

    const stored = localStorage.getItem(USER_ORIGIN_STORAGE_KEY);
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored ?? "{}")).toEqual({
      uiState: { welcomeScreenDismissed: true },
    });
  });

  test.each([{ projectPath: "/repo" }, { projectPath: "/repo", uiState: {} }])(
    "removes the key when there is no uiState to preserve",
    (stored) => {
      localStorage.setItem(USER_ORIGIN_STORAGE_KEY, JSON.stringify(stored));

      clearUserOriginOptions();

      expect(localStorage.getItem(USER_ORIGIN_STORAGE_KEY)).toBeNull();
    }
  );
});
