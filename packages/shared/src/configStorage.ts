import {
  EMPTY_LAYER,
  applyLayerPatch,
  decodeEnvelope,
  encodeEnvelope,
  parseLayer,
  parseLayerPatch,
  type ConfigField,
  type ConfigReadResult,
  type LayerPatchInput,
  type LocatorLayer,
  type LocatorLayerInput,
} from "./config";
import {
  decodeWriteResult,
  type WriteFailureReason,
  type WriteResponse,
  type WriteResult,
} from "./writeResult";

export { decodeWriteResult };
export type { WriteFailureReason, WriteResponse, WriteResult };

export const USER_CONFIG_STORAGE_KEY = "LOCATOR_USER_CONFIG";
export const UI_STATE_STORAGE_KEY = "LOCATOR_UI_STATE";
export const LEGACY_SITE_STORAGE_KEY = "LOCATOR_OPTIONS";
export const PREVIEW_V2_SITE_STORAGE_KEY = "LOCATOR_USER_OPTIONS";

export type UiState = Readonly<{
  welcomeScreenDismissed?: boolean;
  onboarding?: Readonly<{ dismissed?: boolean; step?: string }>;
}>;

export type UserConfigSnapshot = Readonly<{
  revision: number;
  layer: LocatorLayer;
}>;

export type ConfigMutationResult =
  | Readonly<{ ok: true; snapshot: UserConfigSnapshot }>
  | Exclude<WriteResult, { ok: true }>;

type UiEnvelopeV1 = Readonly<{
  version: 1;
  state: UiState;
}>;

type LegacyMigration = Readonly<{
  layer: LocatorLayer;
  uiState: UiState;
}>;

let reportedNoStorage = false;

function reportNoStorage() {
  if (reportedNoStorage) return;
  reportedNoStorage = true;
  console.info(
    "[LocatorJS]: No local storage available. Please check your browser settings."
  );
}

function storage(): Storage | null {
  try {
    if (typeof localStorage !== "undefined" && localStorage !== null) {
      return localStorage;
    }
  } catch {
    // Access itself can throw in sandboxed or opaque-origin documents.
  }
  reportNoStorage();
  return null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function storageFailure(error: unknown): Exclude<WriteResult, { ok: true }> {
  const reason =
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" || error.code === 22)
      ? ("quota" as const)
      : ("blocked" as const);
  return Object.freeze({ ok: false as const, reason });
}

function parseJson(raw: string): unknown | undefined {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function uiStateFromUnknown(value: unknown): UiState | null {
  if (!isPlainObject(value)) return null;
  const allowed = new Set(["welcomeScreenDismissed", "onboarding"]);
  if (Object.keys(value).some((key) => !allowed.has(key))) return null;

  const state: {
    welcomeScreenDismissed?: boolean;
    onboarding?: { dismissed?: boolean; step?: string };
  } = {};
  if (value.welcomeScreenDismissed !== undefined) {
    if (typeof value.welcomeScreenDismissed !== "boolean") return null;
    state.welcomeScreenDismissed = value.welcomeScreenDismissed;
  }
  if (value.onboarding !== undefined) {
    if (!isPlainObject(value.onboarding)) return null;
    const allowedOnboarding = new Set(["dismissed", "step"]);
    if (
      Object.keys(value.onboarding).some((key) => !allowedOnboarding.has(key))
    ) {
      return null;
    }
    const onboarding: { dismissed?: boolean; step?: string } = {};
    if (value.onboarding.dismissed !== undefined) {
      if (typeof value.onboarding.dismissed !== "boolean") return null;
      onboarding.dismissed = value.onboarding.dismissed;
    }
    if (value.onboarding.step !== undefined) {
      if (
        typeof value.onboarding.step !== "string" ||
        value.onboarding.step.trim().length === 0
      ) {
        return null;
      }
      onboarding.step = value.onboarding.step;
    }
    state.onboarding = Object.freeze(onboarding);
  }
  return Object.freeze(state);
}

function decodeUiEnvelope(value: unknown): UiState | null {
  if (
    !isPlainObject(value) ||
    value.version !== 1 ||
    Object.keys(value).some((key) => key !== "version" && key !== "state")
  ) {
    return null;
  }
  return uiStateFromUnknown(value.state);
}

function encodeUiEnvelope(state: UiState): UiEnvelopeV1 {
  return Object.freeze({ version: 1 as const, state });
}

function addLegacyField(
  input: Record<string, unknown>,
  field: ConfigField,
  value: unknown
) {
  if (value === undefined) return;
  const parsed = parseLayer({ [field]: value });
  if (parsed.ok) input[field] = value;
}

/**
 * v1 is the only loose format we salvage field-by-field. Every accepted field
 * is run through the current parser independently, so one stale field cannot
 * poison unrelated user settings and no loose value enters the core.
 */
export function migrateLegacySiteConfig(
  value: unknown
): LegacyMigration | null {
  if (!isPlainObject(value)) return null;
  const input: Record<string, unknown> = {};

  addLegacyField(input, "projectPath", value.projectPath);
  addLegacyField(input, "adapter", value.adapterId);
  addLegacyField(input, "replacePath", value.replacePath);
  addLegacyField(input, "disabled", value.disabled);
  addLegacyField(input, "debugMode", value.debugMode);
  addLegacyField(input, "showIntro", value.showIntro);
  addLegacyField(input, "hrefTarget", value.hrefTarget);
  addLegacyField(input, "tmuxSession", value.tmuxSession);

  if (
    typeof value.templateOrTemplateId === "string" &&
    value.templateOrTemplateId.trim()
  ) {
    const destination = /^[a-z][a-z0-9+.-]*:/i.test(value.templateOrTemplateId)
      ? {
          kind: "template" as const,
          template: value.templateOrTemplateId,
        }
      : { kind: "target" as const, id: value.templateOrTemplateId };
    addLegacyField(input, "editor", destination);
  }

  const parsedLayer = parseLayer(input);
  if (!parsedLayer.ok) {
    throw new Error("Individually parsed legacy fields failed as a layer.");
  }
  const uiState =
    typeof value.welcomeScreenDismissed === "boolean"
      ? Object.freeze({
          welcomeScreenDismissed: value.welcomeScreenDismissed,
        })
      : Object.freeze({});
  return Object.keys(input).length > 0 || Object.keys(uiState).length > 0
    ? Object.freeze({ layer: parsedLayer.value, uiState })
    : null;
}

function migrateLegacyStorage(store: Storage): LegacyMigration | null {
  const rawLegacy = store.getItem(LEGACY_SITE_STORAGE_KEY);
  if (rawLegacy === null) return null;
  const migration = migrateLegacySiteConfig(parseJson(rawLegacy));

  try {
    if (migration && store.getItem(USER_CONFIG_STORAGE_KEY) === null) {
      store.setItem(
        USER_CONFIG_STORAGE_KEY,
        JSON.stringify(encodeEnvelope(migration.layer, 0))
      );
    }
    if (
      migration &&
      Object.keys(migration.uiState).length > 0 &&
      store.getItem(UI_STATE_STORAGE_KEY) === null
    ) {
      store.setItem(
        UI_STATE_STORAGE_KEY,
        JSON.stringify(encodeUiEnvelope(migration.uiState))
      );
    }
    store.removeItem(LEGACY_SITE_STORAGE_KEY);
  } catch {
    // Keep usable legacy values available until all migration writes succeed.
  }
  return migration;
}

export function readUserConfig(): ConfigReadResult {
  const store = storage();
  if (!store) return Object.freeze({ kind: "empty" });
  try {
    const migration = migrateLegacyStorage(store);
    const raw = store.getItem(USER_CONFIG_STORAGE_KEY);
    if (raw !== null) {
      const parsed = parseJson(raw);
      return parsed === undefined
        ? Object.freeze({
            kind: "corrupt" as const,
            errors: Object.freeze([
              Object.freeze({
                path: "/",
                code: "invalid-type" as const,
                message: "Stored configuration is not valid JSON.",
              }),
            ]),
          })
        : decodeEnvelope(parsed);
    }
    if (store.getItem(PREVIEW_V2_SITE_STORAGE_KEY) !== null) {
      return Object.freeze({ kind: "reset-required" });
    }
    return migration
      ? Object.freeze({ kind: "ready", revision: 0, layer: migration.layer })
      : Object.freeze({ kind: "empty" });
  } catch {
    reportNoStorage();
    return Object.freeze({ kind: "empty" });
  }
}

export function snapshotFromRead(
  read: ConfigReadResult
): UserConfigSnapshot | null {
  if (read.kind === "ready") {
    return Object.freeze({ revision: read.revision, layer: read.layer });
  }
  if (read.kind === "empty") {
    return Object.freeze({ revision: 0, layer: EMPTY_LAYER });
  }
  return null;
}

export function patchUserConfig(
  patchInput: LayerPatchInput
): ConfigMutationResult {
  const parsedPatch = parseLayerPatch(patchInput);
  if (!parsedPatch.ok) {
    return Object.freeze({
      ok: false as const,
      reason: "corrupt" as const,
      errors: parsedPatch.errors,
    });
  }
  const currentRead = readUserConfig();
  const current = snapshotFromRead(currentRead);
  if (!current) {
    return Object.freeze({
      ok: false as const,
      reason:
        currentRead.kind === "future-version"
          ? ("future-version" as const)
          : currentRead.kind === "reset-required"
          ? ("reset-required" as const)
          : ("corrupt" as const),
      ...(currentRead.kind === "corrupt" ? { errors: currentRead.errors } : {}),
    });
  }

  const applied = applyLayerPatch(current.layer, parsedPatch.value);
  if (!applied.changed) {
    return Object.freeze({ ok: true, snapshot: current });
  }
  const snapshot = Object.freeze({
    revision: current.revision + 1,
    layer: applied.layer,
  });
  const store = storage();
  if (!store) return Object.freeze({ ok: false, reason: "blocked" });
  try {
    store.setItem(
      USER_CONFIG_STORAGE_KEY,
      JSON.stringify(encodeEnvelope(snapshot.layer, snapshot.revision))
    );
    return Object.freeze({ ok: true, snapshot });
  } catch (error) {
    return storageFailure(error);
  }
}

export function replaceUserConfig(
  input: LocatorLayerInput
): ConfigMutationResult {
  const parsed = parseLayer(input);
  if (!parsed.ok) {
    return Object.freeze({
      ok: false as const,
      reason: "corrupt" as const,
      errors: parsed.errors,
    });
  }
  const currentRead = readUserConfig();
  const current = snapshotFromRead(currentRead);
  const revision = current ? current.revision + 1 : 0;
  const snapshot = Object.freeze({ revision, layer: parsed.value });
  const store = storage();
  if (!store) return Object.freeze({ ok: false, reason: "blocked" });
  try {
    store.setItem(
      USER_CONFIG_STORAGE_KEY,
      JSON.stringify(encodeEnvelope(snapshot.layer, revision))
    );
    store.removeItem(PREVIEW_V2_SITE_STORAGE_KEY);
    return Object.freeze({ ok: true, snapshot });
  } catch (error) {
    return storageFailure(error);
  }
}

export function clearUserConfig(): ConfigMutationResult {
  const store = storage();
  if (!store) return Object.freeze({ ok: false, reason: "blocked" });
  try {
    // Remove the migration source first so a partial reset cannot restore it.
    store.removeItem(LEGACY_SITE_STORAGE_KEY);
    store.removeItem(USER_CONFIG_STORAGE_KEY);
    store.removeItem(PREVIEW_V2_SITE_STORAGE_KEY);
    return Object.freeze({
      ok: true,
      snapshot: Object.freeze({ revision: 0, layer: EMPTY_LAYER }),
    });
  } catch (error) {
    return storageFailure(error);
  }
}

export function readUiState(): UiState {
  const store = storage();
  if (!store) return Object.freeze({});
  try {
    const migration = migrateLegacyStorage(store);
    const raw = store.getItem(UI_STATE_STORAGE_KEY);
    if (raw === null) return migration?.uiState ?? Object.freeze({});
    const parsed = parseJson(raw);
    return parsed === undefined
      ? Object.freeze({})
      : decodeUiEnvelope(parsed) ?? Object.freeze({});
  } catch {
    return Object.freeze({});
  }
}

export function patchUiState(patch: Partial<UiState>): WriteResult {
  const next = uiStateFromUnknown({ ...readUiState(), ...patch });
  if (!next) return Object.freeze({ ok: false, reason: "corrupt" });
  const store = storage();
  if (!store) return Object.freeze({ ok: false, reason: "blocked" });
  try {
    store.setItem(UI_STATE_STORAGE_KEY, JSON.stringify(encodeUiEnvelope(next)));
    return Object.freeze({ ok: true });
  } catch (error) {
    return storageFailure(error);
  }
}

export function listenOnUserConfigChanges(
  listener: (read: ConfigReadResult) => void
): () => void {
  const store = storage();
  if (!store || typeof addEventListener === "undefined") return () => undefined;
  let currentRaw = store.getItem(USER_CONFIG_STORAGE_KEY);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== USER_CONFIG_STORAGE_KEY) return;
    const nextRaw = store.getItem(USER_CONFIG_STORAGE_KEY);
    if (nextRaw === currentRaw) return;
    currentRaw = nextRaw;
    listener(readUserConfig());
  };
  addEventListener("storage", onStorage);
  return () => removeEventListener("storage", onStorage);
}

export function __resetConfigStorageForTesting() {
  reportedNoStorage = false;
}
