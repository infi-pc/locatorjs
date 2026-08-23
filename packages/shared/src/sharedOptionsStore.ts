import {
  normalizeLayer,
  type LocatorOptions,
  type LocatorUserOriginStored,
} from "./layeredOptions";
import { migrateLegacyLocalStorage } from "./migrateLegacyStorage";

export const USER_ORIGIN_STORAGE_KEY = "LOCATOR_USER_OPTIONS";

let reported = false;
function reportNoLocalStorage() {
  if (!reported) {
    console.info(
      `[LocatorJS]: No local storage available. Please check your browser settings.`
    );
    reported = true;
  }
}

function hasLocalStorage() {
  if (typeof localStorage === "undefined" || localStorage == null) {
    reportNoLocalStorage();
    return false;
  }
  return true;
}

let legacyMigrationRan = false;
/** Runs before the first read, so a v1 user's settings are already in place. */
function runLegacyMigrationOnce() {
  if (legacyMigrationRan) return;
  legacyMigrationRan = true;
  migrateLegacyLocalStorage(USER_ORIGIN_STORAGE_KEY);
}

function readStored(): LocatorUserOriginStored {
  if (!hasLocalStorage()) return {};
  runLegacyMigrationOnce();

  try {
    const raw = localStorage.getItem(USER_ORIGIN_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const stored = parsed as LocatorUserOriginStored;
    if (stored.mouseModifiers !== undefined && stored.bindings === undefined) {
      const { uiState, ...options } = stored;
      const migrated: LocatorUserOriginStored = {
        ...normalizeLayer(options),
        ...(uiState ? { uiState } : {}),
      };
      writeStored(migrated);
      return migrated;
    }
    return stored;
  } catch {
    return {};
  }
}

export type WriteResult =
  | { ok: true }
  | { ok: false; reason: "blocked" | "quota" | "corrupt" | "unknown" };

/**
 * What a component hands back from a settings write.
 *
 * Every write crossing a component boundary reports one of these. Three
 * conventions used to coexist -- `void`, `boolean` and `WriteResult` -- and a
 * `!== false` check against a `WriteResult` object silently read every failure
 * as success. One type means a caller that ignores the outcome cannot compile.
 */
export type WriteResponse = WriteResult | Promise<WriteResult>;

function storageFailure(error: unknown): WriteResult {
  const reason =
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" || error.code === 22)
      ? ("quota" as const)
      : ("blocked" as const);
  return { ok: false, reason };
}

function writeStored(value: LocatorUserOriginStored): WriteResult {
  if (!hasLocalStorage()) {
    return { ok: false as const, reason: "blocked" as const };
  }
  try {
    localStorage.setItem(USER_ORIGIN_STORAGE_KEY, JSON.stringify(value));
    return { ok: true as const };
  } catch (error) {
    return storageFailure(error);
  }
}

export function getUserOriginOptions(): LocatorOptions {
  const stored = readStored();
  delete stored.uiState;
  return stored;
}

export function getUserOriginUiState(): NonNullable<
  LocatorUserOriginStored["uiState"]
> {
  return readStored().uiState ?? {};
}

export function setUserOriginOptions(
  patch: Partial<LocatorOptions>
): WriteResult {
  const current = readStored();
  const { uiState, ...currentOpts } = current;
  const next: LocatorUserOriginStored = {
    ...currentOpts,
    ...patch,
  };
  if (
    Object.prototype.hasOwnProperty.call(patch, "mouseModifiers") &&
    !Object.prototype.hasOwnProperty.call(patch, "bindings")
  ) {
    delete next.bindings;
  }
  if (Object.prototype.hasOwnProperty.call(patch, "bindings")) {
    delete next.mouseModifiers;
  }
  if (uiState) next.uiState = uiState;
  return writeStored(next);
}

export function setUserOriginUiState(
  patch: Partial<NonNullable<LocatorUserOriginStored["uiState"]>>
): WriteResult {
  const current = readStored();
  const next: LocatorUserOriginStored = {
    ...current,
    uiState: { ...(current.uiState ?? {}), ...patch },
  };
  return writeStored(next);
}

export function clearUserOriginOptions(): WriteResult {
  if (!hasLocalStorage()) return { ok: false, reason: "blocked" };
  const { uiState } = readStored();
  try {
    if (uiState && Object.keys(uiState).length > 0) {
      return writeStored({ uiState });
    }
    localStorage.removeItem(USER_ORIGIN_STORAGE_KEY);
    return { ok: true };
  } catch (error) {
    return storageFailure(error);
  }
}

/**
 * Watches for changes written by another tab. Returns an unsubscribe: without
 * one, every re-init added another listener that nothing could ever remove.
 */
export function listenOnUserOriginChanges(
  fn: (stored: LocatorUserOriginStored) => void
): () => void {
  if (!hasLocalStorage()) return () => undefined;
  let currentRaw = localStorage.getItem(USER_ORIGIN_STORAGE_KEY);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== USER_ORIGIN_STORAGE_KEY) return;
    const newRaw = localStorage.getItem(USER_ORIGIN_STORAGE_KEY);
    if (newRaw !== currentRaw) {
      currentRaw = newRaw;
      fn(readStored());
    }
  };
  addEventListener("storage", onStorage);
  return () => removeEventListener("storage", onStorage);
}
