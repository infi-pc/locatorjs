const LEGACY_LOCALSTORAGE_KEYS = ["LOCATOR_OPTIONS"] as const;

export function cleanupLegacyLocalStorage(): void {
  if (typeof localStorage === "undefined" || localStorage == null) {
    return;
  }
  for (const key of LEGACY_LOCALSTORAGE_KEYS) {
    try {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
      }
    } catch {
      // Safari private mode / blocked storage: nothing to clean up
    }
  }
}
