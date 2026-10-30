import {
  USER_CONFIG_KEY,
  ensureExtensionStorageReady,
} from '../../storageContract';

export { USER_CONFIG_KEY };

/**
 * Ensures the versioned store is ready before any consumer reads it.
 * Released legacy fields are imported once, then removed after the v3 write.
 */
export async function migrateLegacyExtensionStorage(): Promise<void> {
  await ensureExtensionStorageReady().catch(() => undefined);
}
