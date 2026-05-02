import type {
  LocatorOptions,
  LocatorUserProjectStored,
} from "./layeredOptions";
import { cleanupLegacyLocalStorage } from "./cleanupLegacyStorage";

export const USER_PROJECT_STORAGE_KEY = "LOCATOR_USER_OPTIONS";

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

function readStored(): LocatorUserProjectStored {
  if (!hasLocalStorage()) return {};
  runLegacyCleanupOnce();

  try {
    const raw = localStorage.getItem(USER_PROJECT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as LocatorUserProjectStored;
  } catch {
    return {};
  }
}

function writeStored(value: LocatorUserProjectStored) {
  if (!hasLocalStorage()) {
    return { ok: false as const, reason: "blocked" as const };
  }
  try {
    localStorage.setItem(USER_PROJECT_STORAGE_KEY, JSON.stringify(value));
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

export function getUserProjectOptions(): LocatorOptions {
  const { uiState: _uiState, ...rest } = readStored();
  return rest;
}

export function getUserProjectUiState(): NonNullable<
  LocatorUserProjectStored["uiState"]
> {
  return readStored().uiState ?? {};
}

export type WriteResult =
  | { ok: true }
  | { ok: false; reason: "blocked" | "quota" | "corrupt" | "unknown" };

export function setUserProjectOptions(
  patch: Partial<LocatorOptions>
): WriteResult {
  const current = readStored();
  const { uiState, ...currentOpts } = current;
  const next: LocatorUserProjectStored = {
    ...currentOpts,
    ...patch,
  };
  if (uiState) next.uiState = uiState;
  return writeStored(next);
}

export function setUserProjectUiState(
  patch: Partial<NonNullable<LocatorUserProjectStored["uiState"]>>
): WriteResult {
  const current = readStored();
  const next: LocatorUserProjectStored = {
    ...current,
    uiState: { ...(current.uiState ?? {}), ...patch },
  };
  return writeStored(next);
}

export function clearUserProjectOptions() {
  if (!hasLocalStorage()) return;
  try {
    localStorage.removeItem(USER_PROJECT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function listenOnUserProjectChanges(
  fn: (stored: LocatorUserProjectStored) => void
) {
  if (!hasLocalStorage()) return;
  let currentRaw = localStorage.getItem(USER_PROJECT_STORAGE_KEY);
  addEventListener("storage", (event) => {
    if (event.key !== USER_PROJECT_STORAGE_KEY) return;
    const newRaw = localStorage.getItem(USER_PROJECT_STORAGE_KEY);
    if (newRaw !== currentRaw) {
      currentRaw = newRaw;
      fn(readStored());
    }
  });
}
