import type { LocatorOptions, LocatorUserOriginStored } from "./layeredOptions";
import { cleanupLegacyLocalStorage } from "./cleanupLegacyStorage";

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

let legacyCleanupRan = false;
function runLegacyCleanupOnce() {
  if (legacyCleanupRan) return;
  legacyCleanupRan = true;
  cleanupLegacyLocalStorage();
}

function readStored(): LocatorUserOriginStored {
  if (!hasLocalStorage()) return {};
  runLegacyCleanupOnce();

  try {
    const raw = localStorage.getItem(USER_ORIGIN_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as LocatorUserOriginStored;
  } catch {
    return {};
  }
}

function writeStored(value: LocatorUserOriginStored) {
  if (!hasLocalStorage()) {
    return { ok: false as const, reason: "blocked" as const };
  }
  try {
    localStorage.setItem(USER_ORIGIN_STORAGE_KEY, JSON.stringify(value));
    return { ok: true as const };
  } catch (e) {
    const reason =
      e instanceof DOMException &&
      (e.name === "QuotaExceededError" || e.code === 22)
        ? ("quota" as const)
        : ("blocked" as const);
    return { ok: false as const, reason };
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

export type WriteResult =
  | { ok: true }
  | { ok: false; reason: "blocked" | "quota" | "corrupt" | "unknown" };

export function setUserOriginOptions(
  patch: Partial<LocatorOptions>
): WriteResult {
  const current = readStored();
  const { uiState, ...currentOpts } = current;
  const next: LocatorUserOriginStored = {
    ...currentOpts,
    ...patch,
  };
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

export function clearUserOriginOptions() {
  if (!hasLocalStorage()) return;
  const { uiState } = readStored();
  try {
    if (uiState && Object.keys(uiState).length > 0) {
      localStorage.setItem(
        USER_ORIGIN_STORAGE_KEY,
        JSON.stringify({ uiState })
      );
    } else {
      localStorage.removeItem(USER_ORIGIN_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export function listenOnUserOriginChanges(
  fn: (stored: LocatorUserOriginStored) => void
) {
  if (!hasLocalStorage()) return;
  let currentRaw = localStorage.getItem(USER_ORIGIN_STORAGE_KEY);
  addEventListener("storage", (event) => {
    if (event.key !== USER_ORIGIN_STORAGE_KEY) return;
    const newRaw = localStorage.getItem(USER_ORIGIN_STORAGE_KEY);
    if (newRaw !== currentRaw) {
      currentRaw = newRaw;
      fn(readStored());
    }
  });
}
