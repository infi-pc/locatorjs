import { beforeEach, describe, expect, test } from "vitest";
import { encodeLayer } from "./config";
import {
  LEGACY_SITE_STORAGE_KEY,
  PREVIEW_V2_SITE_STORAGE_KEY,
  UI_STATE_STORAGE_KEY,
  USER_CONFIG_STORAGE_KEY,
  __resetConfigStorageForTesting,
  clearUserConfig,
  migrateLegacySiteConfig,
  patchUiState,
  patchUserConfig,
  readUiState,
  readUserConfig,
} from "./configStorage";

class MemoryLocalStorage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

function storedJson(key: string): unknown {
  const raw = localStorage.getItem(key);
  if (raw === null) throw new Error(`Missing test storage key: ${key}`);
  return JSON.parse(raw);
}

describe("strict configuration storage", () => {
  beforeEach(() => {
    (globalThis as { localStorage?: Storage }).localStorage =
      new MemoryLocalStorage() as Storage;
    __resetConfigStorageForTesting();
  });

  test("writes revision-bearing v3 envelopes and makes no-op retries idempotent", () => {
    const first = patchUserConfig({ set: { projectPath: "/repo/" } });
    expect(first.ok && first.snapshot.revision).toBe(1);
    expect(first.ok && encodeLayer(first.snapshot.layer)).toEqual({
      projectPath: "/repo",
    });

    const retry = patchUserConfig({ set: { projectPath: "/repo" } });
    expect(retry.ok && retry.snapshot.revision).toBe(1);
    expect(storedJson(USER_CONFIG_STORAGE_KEY)).toEqual({
      version: 3,
      revision: 1,
      layer: { projectPath: "/repo" },
    });
  });

  test("rejects an invalid patch without replacing the last valid snapshot", () => {
    expect(
      patchUserConfig({
        set: { editor: { kind: "target", id: "cursor" } },
      }).ok
    ).toBe(true);
    const before = localStorage.getItem(USER_CONFIG_STORAGE_KEY);

    const invalid = patchUserConfig({
      set: {
        editor: { kind: "template", template: "javascript:alert(1)" },
      },
    });

    expect(invalid).toMatchObject({ ok: false, reason: "corrupt" });
    expect(localStorage.getItem(USER_CONFIG_STORAGE_KEY)).toBe(before);
  });

  test("uses explicit unset semantics", () => {
    patchUserConfig({ set: { projectPath: "/repo", disabled: true } });
    const result = patchUserConfig({ unset: ["projectPath"] });

    expect(result.ok && encodeLayer(result.snapshot.layer)).toEqual({
      disabled: true,
    });
  });

  test("marks the unreleased v2 preview as reset-required", () => {
    localStorage.setItem(
      PREVIEW_V2_SITE_STORAGE_KEY,
      JSON.stringify({ projectPath: "/repo" })
    );

    expect(readUserConfig()).toEqual({ kind: "reset-required" });
    expect(patchUserConfig({ set: { disabled: true } })).toEqual({
      ok: false,
      reason: "reset-required",
    });

    expect(clearUserConfig().ok).toBe(true);
    expect(readUserConfig()).toEqual({ kind: "empty" });
  });

  test("salvages each valid v1 field and separates UI state", () => {
    localStorage.setItem(
      LEGACY_SITE_STORAGE_KEY,
      JSON.stringify({
        projectPath: "/repo",
        adapterId: "future-adapter",
        templateOrTemplateId: "my-editor://open/${filePath}",
        replacePath: { from: "[", to: "/src" },
        disabled: true,
        welcomeScreenDismissed: true,
      })
    );

    const read = readUserConfig();
    expect(read.kind === "ready" && encodeLayer(read.layer)).toEqual({
      projectPath: "/repo",
      editor: {
        kind: "template",
        template: "my-editor://open/${filePath}",
      },
      disabled: true,
    });
    expect(readUiState()).toEqual({ welcomeScreenDismissed: true });
    expect(localStorage.getItem(LEGACY_SITE_STORAGE_KEY)).toBeNull();
    expect(storedJson(UI_STATE_STORAGE_KEY)).toEqual({
      version: 1,
      state: { welcomeScreenDismissed: true },
    });
  });

  test("strict current data is all-or-nothing", () => {
    localStorage.setItem(
      USER_CONFIG_STORAGE_KEY,
      JSON.stringify({
        version: 3,
        revision: 4,
        layer: { projectPath: "/repo", futureField: true },
      })
    );

    const read = readUserConfig();
    expect(read.kind).toBe("corrupt");
    expect(read.kind === "corrupt" && read.errors).toContainEqual(
      expect.objectContaining({ path: "/futureField", code: "unknown-key" })
    );
  });

  test("validates UI state before writing it", () => {
    expect(patchUiState({ onboarding: { step: "editor" } })).toEqual({
      ok: true,
    });
    expect(readUiState()).toEqual({ onboarding: { step: "editor" } });

    expect(patchUiState({ onboarding: { step: "" } })).toEqual({
      ok: false,
      reason: "corrupt",
    });
    expect(readUiState()).toEqual({ onboarding: { step: "editor" } });
  });
});

describe("migrateLegacySiteConfig", () => {
  test("returns null when no field survives", () => {
    expect(migrateLegacySiteConfig({ adapterId: "unknown" })).toBeNull();
    expect(migrateLegacySiteConfig(null)).toBeNull();
  });
});
