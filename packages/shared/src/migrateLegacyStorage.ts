import type { LocatorUserOriginStored } from "./layeredOptions";
import { asEditorSelection } from "./targets";

/**
 * v1 stored one blob under `LOCATOR_OPTIONS`; v2 renamed the key and split the
 * editor choice into `editor`. Upgrading has to carry the old settings over --
 * dropping the key would silently reset every existing user's project path,
 * editor and path replacement with no way to get them back.
 */
export const LEGACY_LOCALSTORAGE_KEY = "LOCATOR_OPTIONS";

/** The v1 shape, as `getStoredOptions` wrote it. */
type LegacyOptions = {
  projectPath?: string;
  templateOrTemplateId?: string;
  adapterId?: string;
  replacePath?: { from: string; to: string };
  disabled?: boolean;
  showIntro?: boolean;
  welcomeScreenDismissed?: boolean;
  hrefTarget?: "_blank" | "_self";
  tmuxSession?: string;
};

/**
 * Maps a v1 blob onto the v2 shape. Pure, and as defensive as v1's own reader
 * was: the value is untrusted JSON that any page could have written.
 *
 * Returns `null` when there is nothing worth keeping, so callers can tell
 * "migrated" from "there was only junk here".
 */
export function migrateLegacyOptions(
  raw: unknown
): LocatorUserOriginStored | null {
  if (!raw || typeof raw !== "object") return null;
  const legacy = raw as LegacyOptions;
  const migrated: LocatorUserOriginStored = {};

  if (typeof legacy.projectPath === "string") {
    migrated.projectPath = legacy.projectPath;
  }
  if (typeof legacy.adapterId === "string") {
    migrated.adapterId = legacy.adapterId;
  }
  if (typeof legacy.hrefTarget === "string") {
    migrated.hrefTarget = legacy.hrefTarget;
  }
  if (typeof legacy.tmuxSession === "string") {
    migrated.tmuxSession = legacy.tmuxSession;
  }
  if (typeof legacy.disabled === "boolean") {
    migrated.disabled = legacy.disabled;
  }
  if (typeof legacy.showIntro === "boolean") {
    migrated.showIntro = legacy.showIntro;
  }
  if (
    legacy.replacePath &&
    typeof legacy.replacePath === "object" &&
    typeof legacy.replacePath.from === "string" &&
    typeof legacy.replacePath.to === "string"
  ) {
    migrated.replacePath = {
      from: legacy.replacePath.from,
      to: legacy.replacePath.to,
    };
  }
  if (typeof legacy.templateOrTemplateId === "string") {
    migrated.editor = asEditorSelection(legacy.templateOrTemplateId);
  }
  if (typeof legacy.welcomeScreenDismissed === "boolean") {
    migrated.uiState = {
      welcomeScreenDismissed: legacy.welcomeScreenDismissed,
    };
  }

  return Object.keys(migrated).length > 0 ? migrated : null;
}

/**
 * Moves `LOCATOR_OPTIONS` to `newKey` and removes it. Only writes when `newKey`
 * is absent, so a second run cannot clobber settings made since the upgrade.
 */
export function migrateLegacyLocalStorage(newKey: string): void {
  if (typeof localStorage === "undefined" || localStorage == null) {
    return;
  }
  try {
    const raw = localStorage.getItem(LEGACY_LOCALSTORAGE_KEY);
    if (raw === null) return;

    if (localStorage.getItem(newKey) === null) {
      const migrated = migrateLegacyOptions(JSON.parse(raw));
      if (migrated) localStorage.setItem(newKey, JSON.stringify(migrated));
    }
    localStorage.removeItem(LEGACY_LOCALSTORAGE_KEY);
  } catch {
    // Safari private mode, blocked storage, or unparseable v1 JSON. Leave the
    // old key in place rather than destroying something we could not read.
  }
}
