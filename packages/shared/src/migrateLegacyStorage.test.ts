import { beforeEach, describe, expect, test } from "vitest";
import {
  LEGACY_LOCALSTORAGE_KEY,
  migrateLegacyLocalStorage,
  migrateLegacyOptions,
} from "./migrateLegacyStorage";

const NEW_KEY = "LOCATOR_USER_OPTIONS";

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

function readNew() {
  const raw = localStorage.getItem(NEW_KEY);
  return raw === null ? null : JSON.parse(raw);
}

describe("migrateLegacyOptions", () => {
  test("carries every v1 field onto the v2 shape", () => {
    expect(
      migrateLegacyOptions({
        projectPath: "/Users/me/app",
        templateOrTemplateId: "webstorm",
        adapterId: "react",
        replacePath: { from: "/app", to: "/src" },
        disabled: true,
        showIntro: false,
        hrefTarget: "_blank",
        tmuxSession: "work",
        welcomeScreenDismissed: true,
      })
    ).toEqual({
      projectPath: "/Users/me/app",
      editor: { targetId: "webstorm" },
      adapterId: "react",
      replacePath: { from: "/app", to: "/src" },
      disabled: true,
      showIntro: false,
      hrefTarget: "_blank",
      tmuxSession: "work",
      uiState: { welcomeScreenDismissed: true },
    });
  });

  test("keeps a custom URL as a template, not an id", () => {
    expect(
      migrateLegacyOptions({
        templateOrTemplateId: "myeditor://file/${filePath}",
      })
    ).toEqual({ editor: { targetTemplate: "myeditor://file/${filePath}" } });
  });

  test("ignores fields of the wrong type", () => {
    expect(
      migrateLegacyOptions({
        projectPath: 42,
        disabled: "yes",
        replacePath: { from: "/app" },
        templateOrTemplateId: "vscode",
      })
    ).toEqual({ editor: { targetId: "vscode" } });
  });

  test("reports nothing worth keeping as null", () => {
    expect(migrateLegacyOptions({})).toBeNull();
    expect(migrateLegacyOptions({ unrelated: 1 })).toBeNull();
    expect(migrateLegacyOptions(null)).toBeNull();
    expect(migrateLegacyOptions("string")).toBeNull();
  });
});

describe("migrateLegacyLocalStorage", () => {
  beforeEach(() => {
    (globalThis as unknown as { localStorage: unknown }).localStorage =
      new MemoryLocalStorage();
  });

  test("moves v1 settings across and drops the old key", () => {
    localStorage.setItem(
      LEGACY_LOCALSTORAGE_KEY,
      JSON.stringify({
        projectPath: "/repo",
        templateOrTemplateId: "webstorm",
      })
    );

    migrateLegacyLocalStorage(NEW_KEY);

    expect(readNew()).toEqual({
      projectPath: "/repo",
      editor: { targetId: "webstorm" },
    });
    expect(localStorage.getItem(LEGACY_LOCALSTORAGE_KEY)).toBeNull();
  });

  test("never clobbers settings made since the upgrade", () => {
    localStorage.setItem(
      LEGACY_LOCALSTORAGE_KEY,
      JSON.stringify({ projectPath: "/old" })
    );
    localStorage.setItem(NEW_KEY, JSON.stringify({ projectPath: "/new" }));

    migrateLegacyLocalStorage(NEW_KEY);

    expect(readNew()).toEqual({ projectPath: "/new" });
    expect(localStorage.getItem(LEGACY_LOCALSTORAGE_KEY)).toBeNull();
  });

  test("drops a v1 blob that holds nothing usable", () => {
    localStorage.setItem(LEGACY_LOCALSTORAGE_KEY, JSON.stringify({ foo: 1 }));

    migrateLegacyLocalStorage(NEW_KEY);

    expect(readNew()).toBeNull();
    expect(localStorage.getItem(LEGACY_LOCALSTORAGE_KEY)).toBeNull();
  });

  test("keeps unreadable v1 JSON rather than destroying it", () => {
    localStorage.setItem(LEGACY_LOCALSTORAGE_KEY, "{not json");

    migrateLegacyLocalStorage(NEW_KEY);

    expect(localStorage.getItem(LEGACY_LOCALSTORAGE_KEY)).toBe("{not json");
  });

  test("is idempotent", () => {
    localStorage.setItem(
      LEGACY_LOCALSTORAGE_KEY,
      JSON.stringify({ projectPath: "/repo" })
    );

    migrateLegacyLocalStorage(NEW_KEY);
    migrateLegacyLocalStorage(NEW_KEY);
    migrateLegacyLocalStorage(NEW_KEY);

    expect(readNew()).toEqual({ projectPath: "/repo" });
  });

  test("no-op when the key is absent", () => {
    expect(() => migrateLegacyLocalStorage(NEW_KEY)).not.toThrow();
    expect(readNew()).toBeNull();
  });

  test("does not touch the new key on its own", () => {
    localStorage.setItem(NEW_KEY, JSON.stringify({ a: 1 }));
    migrateLegacyLocalStorage(NEW_KEY);
    expect(readNew()).toEqual({ a: 1 });
  });

  test("fail-soft when getItem throws", () => {
    (globalThis as unknown as { localStorage: unknown }).localStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => undefined,
    };
    expect(() => migrateLegacyLocalStorage(NEW_KEY)).not.toThrow();
  });

  test("no-op when localStorage is absent", () => {
    (globalThis as unknown as { localStorage: unknown }).localStorage =
      undefined;
    expect(() => migrateLegacyLocalStorage(NEW_KEY)).not.toThrow();
  });
});
