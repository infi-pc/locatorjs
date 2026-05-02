import browser from '../../browser';

const LEGACY_EXTENSION_KEYS = [
  'target',
  'controls',
  'allowTracking',
  'enableExperimentalFeatures',
  'clickCount',
  'sharedOnSocialMedia',
];

export function cleanupLegacyExtensionStorage(): Promise<void> {
  return new Promise((resolve) => {
    try {
      browser.storage.local.get(LEGACY_EXTENSION_KEYS, (result) => {
        const presentKeys = LEGACY_EXTENSION_KEYS.filter(
          (k) => result && k in result
        );
        if (presentKeys.length === 0) {
          resolve();
          return;
        }
        browser.storage.local.remove(presentKeys, () => resolve());
      });
    } catch {
      resolve();
    }
  });
}
