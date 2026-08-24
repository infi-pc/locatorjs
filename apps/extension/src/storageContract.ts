import {
  DEFAULT_LAYER,
  asEditorSelection,
  decodeLocatorOptions,
  normalizeLayer,
  primaryEditorShortcut,
  type LocatorOptions,
  type WriteResult,
} from '@locator/shared';
import browser from './browser';

export const USER_OPTIONS_KEY = 'userOptions';
export const USER_OPTIONS_SCHEMA_VERSION = 2;

export type StoredUserOptionsV2 = {
  version: typeof USER_OPTIONS_SCHEMA_VERSION;
  options: LocatorOptions;
};

const LEGACY_COMPATIBILITY_KEYS = ['target', 'controls'] as const;
const OBSOLETE_KEYS = [
  'allowTracking',
  'enableExperimentalFeatures',
  'clickCount',
  'sharedOnSocialMedia',
] as const;
const STORAGE_KEYS = [
  USER_OPTIONS_KEY,
  ...LEGACY_COMPATIBILITY_KEYS,
  ...OBSOLETE_KEYS,
] as const;

function isEnvelope(value: unknown): value is StoredUserOptionsV2 {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    (value as Record<string, unknown>).version ===
      USER_OPTIONS_SCHEMA_VERSION &&
    'options' in value
  );
}

export function decodeStoredUserOptions(value: unknown): LocatorOptions {
  const raw = isEnvelope(value) ? value.options : value;
  return normalizeLayer(decodeLocatorOptions(raw) ?? {});
}

export function encodeStoredUserOptions(
  options: LocatorOptions
): StoredUserOptionsV2 {
  return { version: USER_OPTIONS_SCHEMA_VERSION, options };
}

function migrateLegacyFields(
  current: LocatorOptions,
  legacy: Record<string, unknown>
): LocatorOptions {
  const next = { ...current };
  if (
    next.editor === undefined &&
    typeof legacy.target === 'string' &&
    legacy.target
  ) {
    next.editor = asEditorSelection(legacy.target);
  }
  if (
    next.bindings === undefined &&
    next.mouseModifiers === undefined &&
    typeof legacy.controls === 'string'
  ) {
    next.mouseModifiers = legacy.controls;
  }
  return normalizeLayer(next);
}

function legacyEditor(options: LocatorOptions): string {
  const editor = options.editor ?? DEFAULT_LAYER.editor;
  return editor?.targetId ?? editor?.targetTemplate ?? 'vscode';
}

function legacyControls(options: LocatorOptions): string {
  const shortcut = primaryEditorShortcut(
    options.bindings ?? DEFAULT_LAYER.bindings
  );
  return shortcut?.trigger.kind === 'modifier-click'
    ? shortcut.trigger.modifiers
    : 'alt';
}

async function persist(
  options: LocatorOptions,
  removeObsolete = false
): Promise<WriteResult> {
  try {
    await browser.storage.local.set({
      [USER_OPTIONS_KEY]: encodeStoredUserOptions(options),
      target: legacyEditor(options),
      controls: legacyControls(options),
    });
    if (removeObsolete) await browser.storage.local.remove([...OBSOLETE_KEYS]);
    return { ok: true };
  } catch {
    return { ok: false, reason: 'blocked' };
  }
}

let migrationPromise: Promise<LocatorOptions> | undefined;

export function ensureExtensionStorageReady(): Promise<LocatorOptions> {
  if (!migrationPromise) {
    migrationPromise = (async () => {
      const stored = (await browser.storage.local.get([
        ...STORAGE_KEYS,
      ])) as Record<string, unknown>;
      const current = decodeStoredUserOptions(stored?.[USER_OPTIONS_KEY]);
      const migrated = migrateLegacyFields(current, stored ?? {});
      const result = await persist(migrated, true);
      if (!result.ok) throw new Error('Extension storage migration failed');
      return migrated;
    })().catch((error) => {
      // A transient quota/browser failure must be retriable and must not let a
      // later mutation overwrite the still-unmigrated v1 fields.
      migrationPromise = undefined;
      throw error;
    });
  }
  return migrationPromise;
}

let pendingMutation: Promise<unknown> = Promise.resolve();

export function mutateUserOptions(
  mutation: (current: LocatorOptions) => LocatorOptions
): Promise<WriteResult> {
  const run = pendingMutation.then(async () => {
    try {
      await ensureExtensionStorageReady();
      const stored = await browser.storage.local.get([USER_OPTIONS_KEY]);
      const current = decodeStoredUserOptions(stored?.[USER_OPTIONS_KEY]);
      const candidate = mutation(current);
      const clean = decodeLocatorOptions(candidate);
      if (!clean) return { ok: false as const, reason: 'corrupt' as const };
      return persist(normalizeLayer(clean));
    } catch {
      return { ok: false as const, reason: 'blocked' as const };
    }
  });
  pendingMutation = run.catch(() => undefined);
  return run;
}

export function patchUserOptions(
  patch: Partial<LocatorOptions>
): Promise<WriteResult> {
  return mutateUserOptions((current) => {
    const next = { ...current, ...patch };
    for (const key of Object.keys(next) as (keyof LocatorOptions)[]) {
      if (next[key] === undefined) delete next[key];
    }
    return next;
  });
}

export function replaceUserOptions(
  options: LocatorOptions
): Promise<WriteResult> {
  return mutateUserOptions(() => options);
}

export async function readUserOptions(): Promise<LocatorOptions> {
  await ensureExtensionStorageReady();
  const stored = await browser.storage.local.get([USER_OPTIONS_KEY]);
  return decodeStoredUserOptions(stored?.[USER_OPTIONS_KEY]);
}

export function __resetStorageContractForTesting() {
  migrationPromise = undefined;
  pendingMutation = Promise.resolve();
}
