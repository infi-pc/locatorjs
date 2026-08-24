import {
  asEditorSelection,
  decodeLocatorOptions,
  decodeStoredLocatorOptions,
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

type StoredUserOptionsEnvelope = {
  version: number;
  options: unknown;
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

function isEnvelope(value: unknown): value is StoredUserOptionsEnvelope {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as Record<string, unknown>).version === 'number' &&
    'options' in value
  );
}

export function decodeStoredUserOptions(value: unknown): LocatorOptions {
  const raw = isEnvelope(value) ? value.options : value;
  return normalizeLayer(decodeStoredLocatorOptions(raw) ?? {});
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

function legacyEditor(options: LocatorOptions): string | undefined {
  return options.editor?.targetId ?? options.editor?.targetTemplate;
}

function legacyControls(options: LocatorOptions): string | undefined {
  if (options.bindings === undefined && options.mouseModifiers === undefined) {
    return undefined;
  }
  const shortcut = primaryEditorShortcut(options.bindings);
  return shortcut?.trigger.kind === 'modifier-click'
    ? shortcut.trigger.modifiers
    : options.mouseModifiers;
}

function equal(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function persist(
  options: LocatorOptions,
  previous: Record<string, unknown> = {},
  removeObsolete = false
): Promise<WriteResult> {
  const clean = decodeLocatorOptions(options);
  if (!clean) return { ok: false, reason: 'corrupt' };

  const envelope = encodeStoredUserOptions(normalizeLayer(clean));
  const target = legacyEditor(clean);
  const controls = legacyControls(clean);
  const patch: Record<string, unknown> = {};
  if (!equal(previous[USER_OPTIONS_KEY], envelope)) {
    patch[USER_OPTIONS_KEY] = envelope;
  }
  if (target !== undefined && previous.target !== target) patch.target = target;
  if (controls !== undefined && previous.controls !== controls) {
    patch.controls = controls;
  }
  const remove = [
    ...(removeObsolete ? OBSOLETE_KEYS.filter((key) => key in previous) : []),
    ...(target === undefined && 'target' in previous
      ? ['target' as const]
      : []),
    ...(controls === undefined && 'controls' in previous
      ? ['controls' as const]
      : []),
  ];
  try {
    if (Object.keys(patch).length > 0) await browser.storage.local.set(patch);
    if (remove.length > 0) await browser.storage.local.remove(remove);
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
      const raw = stored?.[USER_OPTIONS_KEY];
      const envelope = isEnvelope(raw) ? raw : undefined;
      const current = decodeStoredUserOptions(raw);
      if (envelope && envelope.version > USER_OPTIONS_SCHEMA_VERSION) {
        return current;
      }
      const migrated = envelope
        ? current
        : migrateLegacyFields(current, stored ?? {});
      const result = await persist(migrated, stored, true);
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
      const stored = await browser.storage.local.get([...STORAGE_KEYS]);
      const envelope = isEnvelope(stored?.[USER_OPTIONS_KEY])
        ? stored[USER_OPTIONS_KEY]
        : undefined;
      if (envelope && envelope.version > USER_OPTIONS_SCHEMA_VERSION) {
        return { ok: false as const, reason: 'corrupt' as const };
      }
      const current = decodeStoredUserOptions(stored?.[USER_OPTIONS_KEY]);
      const candidate = mutation(current);
      return persist(candidate, stored);
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
