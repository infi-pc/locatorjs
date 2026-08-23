import { asEditorSelection, type LocatorOptions } from '@locator/shared';
import browser from '../../browser';

export const USER_OPTIONS_KEY = 'userOptions';

/**
 * v1 kept the editor under `target` and the modifiers under `controls`. Both
 * now live inside the `userOptions` blob, so they have to be carried over --
 * removing them would reset every 1.3.x user to VS Code + Alt on their first
 * page load after the update, with no way back.
 */
const MIGRATED_KEYS = ['target', 'controls'] as const;

/** Telemetry and feature flags that v2 genuinely has no use for. */
const OBSOLETE_KEYS = [
  'allowTracking',
  'enableExperimentalFeatures',
  'clickCount',
  'sharedOnSocialMedia',
] as const;

const LEGACY_EXTENSION_KEYS = [...MIGRATED_KEYS, ...OBSOLETE_KEYS];

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
 * Moves the v1 keys into `userOptions` and removes them. Only writes when
 * `userOptions` is absent, so a second run cannot clobber settings the user
 * has made since upgrading.
 */
export function migrateLegacyExtensionStorage(): Promise<void> {
  return new Promise((resolve) => {
    try {
      browser.storage.local.get(
        [...LEGACY_EXTENSION_KEYS, USER_OPTIONS_KEY],
        (result) => {
          const present = LEGACY_EXTENSION_KEYS.filter(
            (key) => result && key in result
          );
          if (present.length === 0) {
            resolve();
            return;
          }

          const migrated = result[USER_OPTIONS_KEY]
            ? null
            : migrateLegacyExtensionOptions(result);

          const done = () =>
            browser.storage.local.remove(present, () => resolve());

          if (migrated) {
            browser.storage.local.set({ [USER_OPTIONS_KEY]: migrated }, done);
          } else {
            done();
          }
        }
      );
    } catch {
      resolve();
    }
  });
}
