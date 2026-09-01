/* eslint-disable solid/reactivity -- provider callbacks intentionally expose stable imperative methods over signals. */
import {
  createSignal,
  createContext,
  useContext,
  Accessor,
  JSX,
  onCleanup,
} from 'solid-js';
import {
  decodeTryActionResult,
  decodeWriteResult,
  type TryActionResult,
  strictConfig,
  type WriteResult,
} from '@locator/shared';
import browser from '../../browser';
import {
  USER_CONFIG_KEY,
  clearExtensionConfig,
  decodeStoredExtensionConfig,
  layerFromRead,
  patchExtensionConfig,
  readExtensionConfig,
} from '../../storageContract';
import type { ValidatedSnapshot } from '../Content/snapshotBridge';
import {
  clearTabReloadRequirement,
  tabRequiresReload,
} from '../../extensionUpdateState';
/** The tab's main document. Content scripts also run in every iframe. */
const TOP_FRAME_ID = 0;

export type Snapshot = ValidatedSnapshot;

export type ConnectivityStatus =
  | 'loading'
  | 'connected'
  | 'no-runtime'
  | 'reload-required';

type SyncedState = {
  userExtension: Accessor<strictConfig.SerializedLayerV3>;
  extensionConfigRead: Accessor<strictConfig.ConfigReadResult>;
  snapshot: Accessor<Snapshot | null>;
  status: Accessor<ConnectivityStatus>;
  diagnostic: Accessor<string | undefined>;
  siteLocalPresent: Accessor<boolean>;
  setUserExtension: (
    patch: strictConfig.LayerPatchInput
  ) => Promise<WriteResult>;
  setSiteLocal: (patch: strictConfig.LayerPatchInput) => Promise<WriteResult>;
  clearSiteLocal: () => Promise<WriteResult>;
  clearUserExtension: () => Promise<WriteResult>;
  reloadActiveTab: () => Promise<void>;
  tryAction: (action: strictConfig.BindingAction) => Promise<TryActionResult>;
};

const SyncedStateContext = createContext<SyncedState>();

export function SyncedStateProvider(props: { children: JSX.Element }) {
  const [userExtension, setUserExtensionSignal] =
    createSignal<strictConfig.SerializedLayerV3>({});
  const [extensionConfigRead, setExtensionConfigRead] =
    createSignal<strictConfig.ConfigReadResult>({ kind: 'empty' });
  const [snapshot, setSnapshot] = createSignal<Snapshot | null>(null);
  const [status, setStatus] = createSignal<ConnectivityStatus>('loading');
  const [diagnostic, setDiagnostic] = createSignal<string>();
  const [siteLocalPresent, setSiteLocalPresent] = createSignal(false);

  let storageRevision = 0;
  let reloadRequirementClearedForTab: number | undefined;
  const initialRevision = storageRevision;
  readExtensionConfig()
    .then((read) => {
      if (storageRevision === initialRevision) {
        setExtensionConfigRead(read);
        setUserExtensionSignal(layerFromRead(read));
      }
    })
    .catch(() => markNoRuntime('Could not read extension settings.'));

  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    if (USER_CONFIG_KEY in changes) {
      storageRevision += 1;
      const read = decodeStoredExtensionConfig(
        changes[USER_CONFIG_KEY].newValue
      );
      setExtensionConfigRead(read);
      setUserExtensionSignal(layerFromRead(read));
    }
  });

  async function requestSnapshot() {
    try {
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      const currentTab = tabs[0];
      if (!currentTab?.id) {
        setStatus('no-runtime');
        setSnapshot(null);
        return;
      }
      const response = (await browser.tabs.sendMessage(
        currentTab.id,
        {
          from: 'popup',
          subject: 'requestSnapshot',
        },
        // The content script runs in every frame; the popup only ever talks to
        // the top-level document.
        { frameId: TOP_FRAME_ID }
      )) as
        | {
            ok: true;
            protocolVersion: 3;
            extensionVersion: string;
            snapshot: Snapshot;
          }
        | {
            ok: false;
            protocolVersion: 3;
            extensionVersion: string;
            reason: string;
            siteLocalPresent?: boolean;
            diagnostic?: string;
          }
        | undefined;
      if (
        response?.extensionVersion &&
        response.extensionVersion !== browser.runtime.getManifest().version
      ) {
        markReloadRequired();
      } else if (response?.protocolVersion !== 3) {
        await classifyLegacyTab(currentTab.id);
      } else if (response.ok) {
        if (reloadRequirementClearedForTab !== currentTab.id) {
          reloadRequirementClearedForTab = currentTab.id;
          void clearTabReloadRequirement(currentTab.id).catch(() => undefined);
        }
        // Only swap the snapshot when it actually changed — the poll would
        // otherwise recreate the settings DOM every 1.5s and drop focus.
        if (JSON.stringify(response.snapshot) !== JSON.stringify(snapshot())) {
          setSnapshot(response.snapshot);
        }
        setStatus('connected');
        setSiteLocalPresent(
          Object.keys(response.snapshot.layers['user-origin'] ?? {}).length > 0
        );
        setDiagnostic(undefined);
      } else {
        setStatus('no-runtime');
        setSnapshot(null);
        setSiteLocalPresent(response.siteLocalPresent ?? false);
        setDiagnostic(response.diagnostic);
      }
    } catch {
      markNoRuntime();
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      const currentTab = tabs[0];
      if (currentTab?.id) await classifyLegacyTab(currentTab.id);
      else markNoRuntime();
    }
  }

  function markNoRuntime(message?: string) {
    setStatus('no-runtime');
    setSnapshot(null);
    setSiteLocalPresent(false);
    setDiagnostic(message);
  }

  function markReloadRequired(message?: string) {
    setStatus('reload-required');
    setSnapshot(null);
    setSiteLocalPresent(false);
    setDiagnostic(message);
  }

  async function classifyLegacyTab(tabId: number) {
    if (await tabRequiresReload(tabId)) {
      markReloadRequired();
      return;
    }
    try {
      const legacyStatus = await browser.tabs.sendMessage(
        tabId,
        { from: 'popup', subject: 'requestStatusMessage' },
        { frameId: TOP_FRAME_ID }
      );
      if (typeof legacyStatus === 'string') {
        markReloadRequired(legacyStatus);
        return;
      }
    } catch {
      // A missing content script is the normal case on restricted pages.
    }
    markNoRuntime();
  }

  requestSnapshot();
  const refreshInterval = setInterval(requestSnapshot, 1500);
  onCleanup(() => clearInterval(refreshInterval));

  const state: SyncedState = {
    userExtension,
    extensionConfigRead,
    snapshot,
    status,
    diagnostic,
    siteLocalPresent,
    setUserExtension: async (patch) => {
      const result = await patchExtensionConfig(patch);
      if (result.ok) {
        const read = await readExtensionConfig();
        setExtensionConfigRead(read);
        setUserExtensionSignal(layerFromRead(read));
      }
      return result;
    },
    setSiteLocal: async (patch) => {
      try {
        const tabs = await browser.tabs.query({
          active: true,
          currentWindow: true,
        });
        const currentTab = tabs[0];
        if (!currentTab?.id) {
          return { ok: false, reason: 'blocked' };
        }
        const response = decodeWriteResult(
          await browser.tabs.sendMessage(
            currentTab.id,
            {
              from: 'popup',
              subject: 'applySiteLocal',
              set: patch.set ?? {},
              unset: patch.unset ?? [],
            },
            { frameId: TOP_FRAME_ID }
          )
        );
        if (!response) {
          return { ok: false, reason: 'blocked' };
        }
        await requestSnapshot();
        return response;
      } catch {
        return { ok: false, reason: 'blocked' };
      }
    },
    clearSiteLocal: async () => {
      const response = decodeWriteResult(
        await sendToActiveTab({
          from: 'popup',
          subject: 'clearSiteLocal',
        })
      );
      if (response?.ok) await requestSnapshot();
      return response ?? { ok: false, reason: 'blocked' };
    },
    clearUserExtension: async () => {
      const result = await clearExtensionConfig();
      if (result.ok) {
        setExtensionConfigRead({ kind: 'empty' });
        setUserExtensionSignal({});
      }
      return result;
    },
    reloadActiveTab: async () => {
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      const tabId = tabs[0]?.id;
      if (tabId) {
        await browser.tabs.reload(tabId);
        await clearTabReloadRequirement(tabId).catch(() => undefined);
      }
      setStatus('loading');
      await requestSnapshot();
    },
    tryAction: async (action) => {
      const response = decodeTryActionResult(
        await sendToActiveTab({ from: 'popup', subject: 'tryAction', action })
      );
      return response ?? { ok: false, reason: 'blocked' };
    },
  };

  return (
    <SyncedStateContext.Provider value={state}>
      {props.children}
    </SyncedStateContext.Provider>
  );
}

async function sendToActiveTab(message: Record<string, unknown>) {
  try {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    const currentTab = tabs[0];
    if (!currentTab?.id) return undefined;
    return await browser.tabs.sendMessage(currentTab.id, message, {
      frameId: TOP_FRAME_ID,
    });
  } catch {
    return undefined;
  }
}

export function useSyncedState() {
  const ctx = useContext(SyncedStateContext);
  if (!ctx) throw new Error('SyncedStateContext not provided');
  return ctx;
}
