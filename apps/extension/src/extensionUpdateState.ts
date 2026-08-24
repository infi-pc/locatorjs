import browser from './browser';

const EXTENSION_UPDATE_VERSION_KEY = 'locatorExtensionUpdateVersion';
const STALE_TAB_KEY_PREFIX = 'locatorExtensionStaleTab:';

function staleTabKey(tabId: number): string {
  return `${STALE_TAB_KEY_PREFIX}${tabId}`;
}

/** Marks only tabs that were open when an extension update replaced their scripts. */
export async function recordExtensionUpdate(reason: string): Promise<void> {
  const version = browser.runtime.getManifest().version;
  const existing = await browser.storage.local.get(null);
  const oldTabKeys = Object.keys(existing).filter((key) =>
    key.startsWith(STALE_TAB_KEY_PREFIX)
  );
  if (oldTabKeys.length > 0) await browser.storage.local.remove(oldTabKeys);

  const tabs = reason === 'update' ? await browser.tabs.query({}) : [];
  await browser.storage.local.set({
    [EXTENSION_UPDATE_VERSION_KEY]: version,
    ...Object.fromEntries(
      tabs.flatMap((tab) =>
        typeof tab.id === 'number' ? [[staleTabKey(tab.id), version]] : []
      )
    ),
  });
}

export async function tabRequiresReload(tabId: number): Promise<boolean> {
  const tabKey = staleTabKey(tabId);
  const stored = await browser.storage.local.get([
    EXTENSION_UPDATE_VERSION_KEY,
    tabKey,
  ]);
  const currentVersion = browser.runtime.getManifest().version;
  return (
    stored[EXTENSION_UPDATE_VERSION_KEY] === currentVersion &&
    stored[tabKey] === currentVersion
  );
}

export async function clearTabReloadRequirement(tabId: number): Promise<void> {
  await browser.storage.local.remove(staleTabKey(tabId));
}
