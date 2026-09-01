import { type UserConfigSnapshot, type WriteResult } from '@locator/shared';
import {
  DEFAULT_LAYER,
  EMPTY_LAYER,
  applyLayerPatch,
  decodeEnvelope,
  encodeBindings,
  encodeEnvelope,
  encodeLayer,
  parseLayer,
  parseLayerPatch,
} from '@locator/shared/strict-config';
import type * as StrictConfig from '@locator/shared/strict-config';
import browser from './browser';

export const USER_CONFIG_KEY = 'userConfig';
export const PREVIEW_V2_USER_OPTIONS_KEY = 'userOptions';

const LEGACY_KEYS = ['target', 'controls'] as const;
const OBSOLETE_KEYS = [
  'allowTracking',
  'enableExperimentalFeatures',
  'clickCount',
  'sharedOnSocialMedia',
] as const;
const STORAGE_KEYS = [
  USER_CONFIG_KEY,
  PREVIEW_V2_USER_OPTIONS_KEY,
  ...LEGACY_KEYS,
  ...OBSOLETE_KEYS,
] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function decodeStoredExtensionConfig(
  value: unknown
): StrictConfig.ConfigReadResult {
  return decodeEnvelope(value);
}

function legacyDestination(
  value: unknown
): StrictConfig.EditorDestination | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  return /^[a-z][a-z0-9+.-]*:/i.test(value)
    ? { kind: 'template', template: value }
    : { kind: 'target', id: value };
}

function legacyBindings(
  value: unknown
): readonly StrictConfig.BindingInput[] | undefined {
  if (typeof value !== 'string') return undefined;
  const modifiers = value
    .split('+')
    .map((modifier) => modifier.trim())
    .filter(Boolean);
  const defaultBindings = encodeBindings(DEFAULT_LAYER.bindings!);
  const candidate: unknown[] = [
    ...(modifiers.length > 0
      ? [
          {
            trigger: { kind: 'modifier-click' as const, modifiers },
            action: { kind: 'open-editor' as const },
          },
        ]
      : []),
    ...defaultBindings.filter(
      (binding) => binding.trigger.kind === 'hover-toolbar'
    ),
  ];
  const parsed = parseLayer({ bindings: candidate });
  return parsed.ok ? encodeLayer(parsed.value).bindings : undefined;
}

/** Released v1 keys are salvaged independently through the current parser. */
export function migrateLegacyExtensionFields(
  legacy: Record<string, unknown>
): StrictConfig.LocatorLayer {
  const editor = legacyDestination(legacy.target);
  const bindings = legacyBindings(legacy.controls);
  const input: StrictConfig.LocatorLayerInput = {
    ...(editor ? { editor } : {}),
    ...(bindings ? { bindings } : {}),
  };
  const parsed = parseLayer(input);
  if (!parsed.ok) {
    throw new Error('Individually parsed extension fields failed as a layer.');
  }
  return parsed.value;
}

async function rawStorage(): Promise<Record<string, unknown>> {
  return (await browser.storage.local.get([...STORAGE_KEYS])) as Record<
    string,
    unknown
  >;
}

async function migrateLegacyStorage(
  stored: Record<string, unknown>
): Promise<StrictConfig.ConfigReadResult> {
  if (stored[USER_CONFIG_KEY] !== undefined) {
    const read = decodeStoredExtensionConfig(stored[USER_CONFIG_KEY]);
    const staleKeys =
      read.kind === 'ready'
        ? [
            ...LEGACY_KEYS.filter((key) => key in stored),
            ...OBSOLETE_KEYS.filter((key) => key in stored),
          ]
        : OBSOLETE_KEYS.filter((key) => key in stored);
    if (staleKeys.length > 0) {
      await browser.storage.local.remove(staleKeys);
    }
    return read;
  }
  if (stored[PREVIEW_V2_USER_OPTIONS_KEY] !== undefined) {
    return { kind: 'reset-required' };
  }
  const hasLegacy = LEGACY_KEYS.some((key) => stored[key] !== undefined);
  if (!hasLegacy) {
    const obsolete = OBSOLETE_KEYS.filter((key) => key in stored);
    if (obsolete.length > 0) await browser.storage.local.remove(obsolete);
    return { kind: 'empty' };
  }

  const layer = migrateLegacyExtensionFields(stored);
  await browser.storage.local.set({
    [USER_CONFIG_KEY]: encodeEnvelope(layer, 0),
  });
  await browser.storage.local.remove([
    ...LEGACY_KEYS,
    ...OBSOLETE_KEYS.filter((key) => key in stored),
  ]);
  return { kind: 'ready', revision: 0, layer };
}

let readinessPromise: Promise<StrictConfig.ConfigReadResult> | undefined;

export function ensureExtensionStorageReady(): Promise<StrictConfig.ConfigReadResult> {
  if (!readinessPromise) {
    readinessPromise = rawStorage()
      .then(migrateLegacyStorage)
      .catch((error) => {
        readinessPromise = undefined;
        throw error;
      });
  }
  return readinessPromise;
}

export async function readExtensionConfig(): Promise<StrictConfig.ConfigReadResult> {
  await ensureExtensionStorageReady();
  const stored = await browser.storage.local.get([
    USER_CONFIG_KEY,
    PREVIEW_V2_USER_OPTIONS_KEY,
  ]);
  if (stored?.[USER_CONFIG_KEY] !== undefined) {
    return decodeStoredExtensionConfig(stored[USER_CONFIG_KEY]);
  }
  return stored?.[PREVIEW_V2_USER_OPTIONS_KEY] !== undefined
    ? { kind: 'reset-required' }
    : { kind: 'empty' };
}

export function layerFromRead(
  read: StrictConfig.ConfigReadResult
): StrictConfig.SerializedLayerV3 {
  return read.kind === 'ready' ? encodeLayer(read.layer) : {};
}

async function persist(snapshot: UserConfigSnapshot): Promise<WriteResult> {
  try {
    await browser.storage.local.set({
      [USER_CONFIG_KEY]: encodeEnvelope(snapshot.layer, snapshot.revision),
    });
    return { ok: true };
  } catch {
    return { ok: false, reason: 'blocked' };
  }
}

let pendingMutation: Promise<unknown> = Promise.resolve();

function mutate(
  mutation: (
    current: UserConfigSnapshot
  ) =>
    | { ok: true; snapshot: UserConfigSnapshot }
    | Exclude<WriteResult, { ok: true }>
): Promise<WriteResult> {
  const run = pendingMutation.then(async () => {
    try {
      const read = await readExtensionConfig();
      const current = snapshotFromRead(read);
      if (!current) {
        return {
          ok: false as const,
          reason:
            read.kind === 'future-version'
              ? ('future-version' as const)
              : read.kind === 'reset-required'
              ? ('reset-required' as const)
              : ('corrupt' as const),
        };
      }
      const result = mutation(current);
      if (!result.ok) return result;
      return result.snapshot === current
        ? ({ ok: true } as const)
        : persist(result.snapshot);
    } catch {
      return { ok: false as const, reason: 'blocked' as const };
    }
  });
  pendingMutation = run.catch(() => undefined);
  return run;
}

export function patchExtensionConfig(
  patchInput: StrictConfig.LayerPatchInput
): Promise<WriteResult> {
  const parsed = parseLayerPatch(patchInput);
  if (!parsed.ok) {
    return Promise.resolve({
      ok: false,
      reason: 'corrupt',
      errors: parsed.errors,
    });
  }
  return mutate((current) => {
    const applied = applyLayerPatch(current.layer, parsed.value);
    return {
      ok: true,
      snapshot: applied.changed
        ? {
            revision: current.revision + 1,
            layer: applied.layer,
          }
        : current,
    };
  });
}

export async function clearExtensionConfig(): Promise<WriteResult> {
  try {
    await browser.storage.local.remove([
      USER_CONFIG_KEY,
      PREVIEW_V2_USER_OPTIONS_KEY,
      ...LEGACY_KEYS,
      ...OBSOLETE_KEYS,
    ]);
    readinessPromise = Promise.resolve({ kind: 'empty' });
    return { ok: true };
  } catch {
    return { ok: false, reason: 'blocked' };
  }
}

export function __resetStorageContractForTesting() {
  readinessPromise = undefined;
  pendingMutation = Promise.resolve();
}

function snapshotFromRead(
  read: StrictConfig.ConfigReadResult
): UserConfigSnapshot | null {
  if (read.kind === 'ready') {
    return Object.freeze({ revision: read.revision, layer: read.layer });
  }
  if (read.kind === 'empty') {
    return Object.freeze({ revision: 0, layer: EMPTY_LAYER });
  }
  return null;
}
