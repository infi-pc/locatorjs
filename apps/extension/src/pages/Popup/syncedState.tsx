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
import { canonicalHttpOrigin, type OriginAccess } from '../../originAccess';
import { grantOrigin, revokeOrigin } from '../../originTrust';
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
  originAccess: Accessor<OriginAccess>;
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
  grantOrigin: (origin: string) => Promise<void>;
  revokeOrigin: (origin: string) => Promise<void>;
};

const SyncedStateContext = createContext<SyncedState>();

export function SyncedStateProvider(props: { children: JSX.Element }) {
  const [userExtension, setUserExtensionSignal] =
    createSignal<strictConfig.SerializedLayerV3>({});
  const [extensionConfigRead, setExtensionConfigRead] =
    createSignal<strictConfig.ConfigReadResult>({ kind: 'empty' });
  const [snapshot, setSnapshot] = createSignal<Snapshot | null>(null);
  const [originAccess, setOriginAccess] = createSignal<OriginAccess>({
    origin: null,
    reason: 'unavailable',
  });
  const [status, setStatus] = createSignal<ConnectivityStatus>('loading');
  const [diagnostic, setDiagnostic] = createSignal<string>();
  const [siteLocalPresent, setSiteLocalPresent] = createSignal(false);

  let storageRevision = 0;
  const initialRevision = storageRevision;
  let reloadRequirementClearedForTab: number | undefined;
  let requestGeneration = 0;
  const [displayedTarget, setDisplayedTarget] = createSignal<{
    tabId: number;
    origin: string | null;
  }>();
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
    const generation = ++requestGeneration;
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
            protocolVersion: 4;
            extensionVersion: string;
            snapshot: Snapshot;
            access: OriginAccess;
          }
        | {
            ok: false;
            protocolVersion: 4;
            extensionVersion: string;
            reason: string;
            siteLocalPresent?: boolean;
            diagnostic?: string;
            access?: OriginAccess;
          }
        | undefined;
      if (generation !== requestGeneration) return;
      if (
        response?.extensionVersion &&
        response.extensionVersion !== browser.runtime.getManifest().version
      ) {
        markReloadRequired();
      } else if (
        response?.ok === false &&
        response.protocolVersion === 4 &&
        isValidOriginAccess(response.access)
      ) {
        setStatus('no-runtime');
        setSnapshot(null);
        setSiteLocalPresent(response.siteLocalPresent ?? false);
        setDiagnostic(response.diagnostic);
        setOriginAccess(response.access);
        setDisplayedTarget({
          tabId: currentTab.id,
          origin: response.access.origin,
        });
      } else if (
        response?.protocolVersion !== 4 ||
        !isValidOriginAccess(response?.access)
      ) {
        await classifyLegacyTab(currentTab.id, generation);
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
        setOriginAccess(response.access);
        setDisplayedTarget({
          tabId: currentTab.id,
          origin: response.access.origin,
        });
        setSiteLocalPresent(
          Object.keys(response.snapshot.layers['user-origin'] ?? {}).length > 0
        );
        setDiagnostic(undefined);
      } else {
        setStatus('no-runtime');
        setSnapshot(null);
        setDiagnostic(response.diagnostic);
        setOriginAccess(response.access);
        setDisplayedTarget({
          tabId: currentTab.id,
          origin: response.access.origin,
        });
      }
    } catch {
      const hadContentIdentity = !!displayedTarget()?.origin;
      markNoRuntime(undefined, hadContentIdentity);
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      const currentTab = tabs[0];
      if (currentTab?.id)
        await classifyLegacyTab(currentTab.id, generation, hadContentIdentity);
      else if (!hadContentIdentity) markNoRuntime();
    }
  }

  function markNoRuntime(message?: string, preserveAccess = false) {
    setStatus('no-runtime');
    setSnapshot(null);
    setSiteLocalPresent(false);
    if (!preserveAccess) {
      setOriginAccess({ origin: null, reason: 'unavailable' });
      setDisplayedTarget(undefined);
    }
    setDiagnostic(message);
  }

  function markReloadRequired(message?: string) {
    setStatus('reload-required');
    setSnapshot(null);
    setSiteLocalPresent(false);
    setOriginAccess({ origin: null, reason: 'unavailable' });
    setDisplayedTarget(undefined);
    setDiagnostic(message);
  }

  async function classifyLegacyTab(
    tabId: number,
    generation = requestGeneration,
    preserveAccess = false
  ) {
    if (await tabRequiresReload(tabId)) {
      if (generation !== requestGeneration) return;
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
        if (generation !== requestGeneration) return;
        markReloadRequired(legacyStatus);
        return;
      }
    } catch {
      // A missing content script is the normal case on restricted pages.
    }
    if (generation === requestGeneration)
      markNoRuntime(undefined, preserveAccess);
  }

  requestSnapshot();
  const refreshInterval = setInterval(requestSnapshot, 1500);
  onCleanup(() => clearInterval(refreshInterval));

  const state: SyncedState = {
    userExtension,
    extensionConfigRead,
    snapshot,
    originAccess,
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
        const target = displayedTarget();
        if (!target) {
          return { ok: false, reason: 'blocked' };
        }
        const response = decodeWriteResult(
          await browser.tabs.sendMessage(
            target.tabId,
            {
              from: 'popup',
              subject: 'applySiteLocal',
              set: patch.set ?? {},
              unset: patch.unset ?? [],
              expectedOrigin: target.origin ?? undefined,
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
      const target = displayedTarget();
      if (!target) return { ok: false, reason: 'blocked' };
      const response = decodeWriteResult(
        await sendToTab(target, {
          from: 'popup',
          subject: 'clearSiteLocal',
          expectedOrigin: target.origin ?? undefined,
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
      const target = displayedTarget();
      if (!target) return { ok: false, reason: 'blocked' };
      const response = decodeTryActionResult(
        await sendToTab(target, {
          from: 'popup',
          subject: 'tryAction',
          action,
          expectedOrigin: target.origin ?? undefined,
        })
      );
      return response ?? { ok: false, reason: 'blocked' };
    },
    grantOrigin: async (origin) => grantOrigin(origin),
    revokeOrigin: async (origin) => revokeOrigin(origin),
  };

  return (
    <SyncedStateContext.Provider value={state}>
      {props.children}
    </SyncedStateContext.Provider>
  );
}

async function sendToTab(
  target: { tabId: number; origin: string | null },
  message: Record<string, unknown>
) {
  try {
    return await browser.tabs.sendMessage(target.tabId, message, {
      frameId: TOP_FRAME_ID,
    });
  } catch {
    return undefined;
  }
}

function isValidOriginAccess(value: unknown): value is OriginAccess {
  if (!value || typeof value !== 'object') return false;
  const access = value as Record<string, unknown>;
  if (access.origin === null) return access.reason === 'unavailable';
  return (
    typeof access.origin === 'string' &&
    canonicalHttpOrigin(access.origin) === access.origin &&
    (access.reason === 'localhost' ||
      access.reason === 'approved' ||
      access.reason === 'approval-required')
  );
}

export function useSyncedState() {
  const ctx = useContext(SyncedStateContext);
  if (!ctx) throw new Error('SyncedStateContext not provided');
  return ctx;
}
