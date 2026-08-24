import { beforeEach, describe, expect, test } from "vitest";
import {
  clearUserOriginOptions,
  decodeWriteResult,
  getUserOriginOptions,
  setUserOriginOptions,
  USER_ORIGIN_STORAGE_KEY,
} from "./sharedOptionsStore";

describe("decodeWriteResult", () => {
  test("rebuilds valid results and discards extra fields", () => {
    expect(decodeWriteResult({ ok: true, extra: "ignored" })).toEqual({
      ok: true,
    });
    expect(
      decodeWriteResult({ ok: false, reason: "quota", extra: "ignored" })
    ).toEqual({ ok: false, reason: "quota" });
  });

  test("maps unknown failure reasons into the closed union", () => {
    expect(decodeWriteResult({ ok: false, reason: "hunter2" })).toEqual({
      ok: false,
      reason: "unknown",
    });
  });

  test.each([null, [], {}, { ok: "yes" }])(
    "rejects a malformed result: %j",
    (value) => {
      expect(decodeWriteResult(value)).toBeNull();
    }
  );
});

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
      action: { kind: "open-editor" },
    });
    expect(JSON.parse(localStorage.getItem(USER_ORIGIN_STORAGE_KEY)!)).toEqual({
      bindings: [
        {
          trigger: { kind: "modifier-click", modifiers: "meta" },
          action: { kind: "open-editor" },
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

  test("drops unreadable stored fields while preserving valid options", () => {
    localStorage.setItem(
      USER_ORIGIN_STORAGE_KEY,
      JSON.stringify({
        projectPath: "/repo",
        editor: { targetTemplate: "javascript:alert(1)" },
        futureOption: true,
      })
    );

    expect(getUserOriginOptions()).toEqual({ projectPath: "/repo" });
  });

  test("does not let an invalid site patch replace a valid editor", () => {
    localStorage.setItem(
      USER_ORIGIN_STORAGE_KEY,
      JSON.stringify({ editor: { targetId: "cursor" } })
    );

    expect(
      setUserOriginOptions({
        editor: { targetTemplate: "missing-scheme" },
      })
    ).toEqual({ ok: true });
    expect(getUserOriginOptions()).toEqual({ editor: { targetId: "cursor" } });
  });
});
