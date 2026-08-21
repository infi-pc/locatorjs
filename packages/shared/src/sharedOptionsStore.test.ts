import { beforeEach, describe, expect, test } from "vitest";
import {
  clearUserOriginOptions,
  getUserOriginOptions,
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

    expect(clearUserOriginOptions()).toEqual({ ok: true });

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

      expect(clearUserOriginOptions()).toEqual({ ok: true });

      expect(localStorage.getItem(USER_ORIGIN_STORAGE_KEY)).toBeNull();
    }
  );

  test("reports unavailable storage instead of claiming success", () => {
    (globalThis as { localStorage?: Storage }).localStorage = undefined;

    expect(clearUserOriginOptions()).toEqual({
      ok: false,
      reason: "blocked",
    });
  });

  test("reports storage failures", () => {
    localStorage.setItem(
      USER_ORIGIN_STORAGE_KEY,
      JSON.stringify({ projectPath: "/repo" })
    );
    localStorage.removeItem = () => {
      throw new DOMException("blocked", "SecurityError");
    };

    expect(clearUserOriginOptions()).toEqual({
      ok: false,
      reason: "blocked",
    });
    expect(localStorage.getItem(USER_ORIGIN_STORAGE_KEY)).not.toBeNull();
  });

  test("lazily writes legacy mouse modifiers back as bindings", () => {
    localStorage.setItem(
      USER_ORIGIN_STORAGE_KEY,
      JSON.stringify({
        mouseModifiers: "meta",
        uiState: { onboarding: { step: "editor" } },
      })
    );

    expect(getUserOriginOptions().bindings?.[0]).toEqual({
      trigger: { kind: "modifier-click", modifiers: "meta" },
      action: { kind: "open-editor", targetId: "vscode" },
    });
    expect(JSON.parse(localStorage.getItem(USER_ORIGIN_STORAGE_KEY)!)).toEqual({
      bindings: [
        {
          trigger: { kind: "modifier-click", modifiers: "meta" },
          action: { kind: "open-editor", targetId: "vscode" },
        },
        {
          trigger: { kind: "hover-toolbar" },
          action: { kind: "show-tree" },
        },
        {
          trigger: { kind: "hover-toolbar" },
          action: { kind: "show-parents" },
        },
        {
          trigger: { kind: "hover-toolbar" },
          action: { kind: "copy-path" },
        },
      ],
      uiState: { onboarding: { step: "editor" } },
    });
  });
});
