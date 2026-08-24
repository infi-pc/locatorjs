import {
  USER_OPTIONS_KEY,
  ensureExtensionStorageReady,
} from '../../storageContract';

export { USER_OPTIONS_KEY };

/**
 * Ensures the versioned store is ready before any consumer reads it.
 * Compatibility keys stay mirrored for already-open v1 content scripts.
 */
export async function migrateLegacyExtensionStorage(): Promise<void> {
  await ensureExtensionStorageReady().catch(() => undefined);
}
