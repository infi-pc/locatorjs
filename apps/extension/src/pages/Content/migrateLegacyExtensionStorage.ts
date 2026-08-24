import { asEditorSelection, type LocatorOptions } from '@locator/shared';
import {
  USER_OPTIONS_KEY,
  ensureExtensionStorageReady,
} from '../../storageContract';

export { USER_OPTIONS_KEY };

type LegacyExtensionStorage = {
  target?: unknown;
  controls?: unknown;
};

export function migrateLegacyExtensionOptions(
  legacy: LegacyExtensionStorage
): LocatorOptions | null {
  const migrated: LocatorOptions = {};

  if (typeof legacy.target === 'string' && legacy.target) {
    migrated.editor = asEditorSelection(legacy.target);
  }
  if (typeof legacy.controls === 'string') {
    // `normalizeLayer` turns this into a `bindings` list on the next read.
    migrated.mouseModifiers = legacy.controls;
  }

  return Object.keys(migrated).length > 0 ? migrated : null;
}

/**
 * Ensures the versioned store is ready before any consumer reads it.
 * Compatibility keys stay mirrored for already-open v1 content scripts.
 */
export async function migrateLegacyExtensionStorage(): Promise<void> {
  await ensureExtensionStorageReady().catch(() => undefined);
}
