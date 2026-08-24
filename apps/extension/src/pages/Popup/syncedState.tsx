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
  serializePatch,
  type LocatorOptions,
  type LocatorLayer,
  type Targets,
  type WriteResult,
  type BindingAction,
} from '@locator/shared';
import browser from '../../browser';
import {
  USER_OPTIONS_KEY,
  decodeStoredUserOptions,
  encodeStoredUserOptions,
  patchUserOptions,
  readUserOptions,
  replaceUserOptions,
} from '../../storageContract';
import {
  clearTabReloadRequirement,
  tabRequiresReload,
} from '../../extensionUpdateState';
/** The tab's main document. Content scripts also run in every iframe. */
const TOP_FRAME_ID = 0;

export type Snapshot = {
  effective: LocatorOptions;
  provenance: Partial<Record<keyof LocatorOptions, LocatorLayer>>;
  layers: Partial<Record<LocatorLayer, LocatorOptions>>;
  allTargets: Targets;
};

export type ConnectivityStatus =
  | 'loading'
  | 'connected'
  | 'no-runtime'
  | 'reload-required';

type SyncedState = {
  userExtension: Accessor<LocatorOptions>;
  snapshot: Accessor<Snapshot | null>;
  status: Accessor<ConnectivityStatus>;
  diagnostic: Accessor<string | undefined>;
  siteLocalPresent: Accessor<boolean>;
  setUserExtension: (patch: Partial<LocatorOptions>) => Promise<WriteResult>;
  setSiteLocal: (patch: Partial<LocatorOptions>) => Promise<WriteResult>;
  clearSiteLocal: () => Promise<WriteResult>;
  clearUserExtension: () => Promise<WriteResult>;
  reloadActiveTab: () => Promise<void>;
  tryAction: (
    action: BindingAction
  ) => Promise<{ ok: true } | { ok: false; reason: string }>;
};

const SyncedStateContext = createContext<SyncedState>();

export function SyncedStateProvider(props: { children: JSX.Element }) {
  const [userExtension, setUserExtensionSignal] = createSignal<LocatorOptions>(
    {}
  );
  const [snapshot, setSnapshot] = createSignal<Snapshot | null>(null);
  const [status, setStatus] = createSignal<ConnectivityStatus>('loading');
  const [diagnostic, setDiagnostic] = createSignal<string>();
  const [siteLocalPresent, setSiteLocalPresent] = createSignal(false);

  let storageRevision = 0;
  let reloadRequirementClearedForTab: number | undefined;
  const initialRevision = storageRevision;
  readUserOptions()
    .then((options) => {
      if (storageRevision === initialRevision) setUserExtensionSignal(options);
    })
    .catch(() => markNoRuntime('Could not read extension settings.'));

  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    if (USER_OPTIONS_KEY in changes) {
      storageRevision += 1;
      const raw = changes[USER_OPTIONS_KEY].newValue;
      const decoded = decodeStoredUserOptions(raw);
      setUserExtensionSignal(decoded);
      if (
        JSON.stringify(raw) !==
          JSON.stringify(encodeStoredUserOptions(decoded)) &&
        (Object.keys(decoded).length > 0 ||
          (typeof raw === 'object' &&
            raw !== null &&
            'options' in raw &&
            typeof raw.options === 'object' &&
            raw.options !== null &&
            Object.keys(raw.options).length === 0))
      ) {
        void replaceUserOptions(decoded);
      }
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
            protocolVersion: 2;
            extensionVersion: string;
            snapshot: Snapshot;
          }
        | {
            ok: false;
            protocolVersion: 2;
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
      } else if (response?.protocolVersion !== 2) {
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
    snapshot,
    status,
    diagnostic,
    siteLocalPresent,
    setUserExtension: async (patch) => {
      const result = await patchUserOptions(patch);
      if (result.ok) setUserExtensionSignal(await readUserOptions());
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
        const serialized = serializePatch(patch);
        const response = (await browser.tabs.sendMessage(
          currentTab.id,
          {
            from: 'popup',
            subject: 'applySiteLocal',
            patch: serialized.patch,
            unset: serialized.unset,
          },
          { frameId: TOP_FRAME_ID }
        )) as WriteResult | undefined;
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
      const response = await sendToActiveTab<WriteResult>({
        from: 'popup',
        subject: 'clearSiteLocal',
      });
      if (response?.ok) await requestSnapshot();
      return response ?? { ok: false, reason: 'blocked' };
    },
    clearUserExtension: async () => {
      const result = await replaceUserOptions({});
      if (result.ok) setUserExtensionSignal({});
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
      const response = await sendToActiveTab<
        { ok: true } | { ok: false; reason: string }
      >({ from: 'popup', subject: 'tryAction', action });
      return response ?? { ok: false, reason: 'blocked' };
    },
  };

  return (
    <SyncedStateContext.Provider value={state}>
      {props.children}
    </SyncedStateContext.Provider>
  );
}

async function sendToActiveTab<T>(message: Record<string, unknown>) {
  try {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    const currentTab = tabs[0];
    if (!currentTab?.id) return undefined;
    return (await browser.tabs.sendMessage(currentTab.id, message, {
      frameId: TOP_FRAME_ID,
    })) as T | undefined;
  } catch {
    return undefined;
  }
}

export function useSyncedState() {
  const ctx = useContext(SyncedStateContext);
  if (!ctx) throw new Error('SyncedStateContext not provided');
  return ctx;
}
