/* eslint-disable solid/reactivity */
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
  normalizeLayer,
  type LocatorOptions,
  type LocatorLayer,
  type Targets,
  type WriteResult,
  type BindingAction,
} from '@locator/shared';
import browser from '../../browser';

const USER_OPTIONS_KEY = 'userOptions';
/** The tab's main document. Content scripts also run in every iframe. */
const TOP_FRAME_ID = 0;

export type Snapshot = {
  effective: LocatorOptions;
  provenance: Partial<Record<keyof LocatorOptions, LocatorLayer>>;
  layers: Partial<Record<LocatorLayer, LocatorOptions>>;
  allTargets: Targets;
};

export type ConnectivityStatus = 'loading' | 'connected' | 'no-runtime';

type SyncedState = {
  userExtension: Accessor<LocatorOptions>;
  snapshot: Accessor<Snapshot | null>;
  status: Accessor<ConnectivityStatus>;
  setUserExtension: (patch: Partial<LocatorOptions>) => Promise<WriteResult>;
  setSiteLocal: (patch: Partial<LocatorOptions>) => Promise<WriteResult>;
  clearSiteLocal: () => Promise<WriteResult>;
  clearUserExtension: () => Promise<WriteResult>;
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

  browser.storage.local.get([USER_OPTIONS_KEY]).then((result) => {
    const stored = (result?.[USER_OPTIONS_KEY] ?? {}) as LocatorOptions;
    const normalized = normalizeLayer(stored);
    setUserExtensionSignal(normalized);
    if (stored.mouseModifiers !== undefined && stored.bindings === undefined) {
      browser.storage.local.set({ [USER_OPTIONS_KEY]: normalized });
    }
  });

  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    if (USER_OPTIONS_KEY in changes) {
      const next = (changes[USER_OPTIONS_KEY].newValue ?? {}) as LocatorOptions;
      const normalized = normalizeLayer(next);
      setUserExtensionSignal(normalized);
      if (next.mouseModifiers !== undefined && next.bindings === undefined) {
        browser.storage.local.set({ [USER_OPTIONS_KEY]: normalized });
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
        | { ok: true; snapshot: Snapshot }
        | { ok: false; reason: string }
        | undefined;
      if (response?.ok) {
        // Only swap the snapshot when it actually changed — the poll would
        // otherwise recreate the settings DOM every 1.5s and drop focus.
        if (JSON.stringify(response.snapshot) !== JSON.stringify(snapshot())) {
          setSnapshot(response.snapshot);
        }
        setStatus('connected');
      } else {
        setStatus('no-runtime');
        setSnapshot(null);
      }
    } catch {
      // no content script in the active tab (chrome:// pages etc.)
      setStatus('no-runtime');
      setSnapshot(null);
    }
  }

  requestSnapshot();
  const refreshInterval = setInterval(requestSnapshot, 1500);
  onCleanup(() => clearInterval(refreshInterval));

  /**
   * Writes are read-modify-write over the whole options blob, so two of them
   * in flight at once would both merge onto the same starting value and the
   * first change would be lost. Queueing keeps each one reading what the
   * previous one wrote.
   */
  let pendingWrite: Promise<unknown> = Promise.resolve();
  function queueUserExtensionWrite(
    patch: Partial<LocatorOptions>
  ): Promise<WriteResult> {
    const run = pendingWrite.then(async (): Promise<WriteResult> => {
      const next = { ...userExtension(), ...patch };
      // Strip undefined to keep storage clean
      for (const key of Object.keys(next) as (keyof LocatorOptions)[]) {
        if (next[key] === undefined) delete next[key];
      }
      try {
        await browser.storage.local.set({ [USER_OPTIONS_KEY]: next });
        setUserExtensionSignal(next);
        return { ok: true };
      } catch {
        return { ok: false, reason: 'blocked' };
      }
    });
    pendingWrite = run.catch(() => undefined);
    return run;
  }

  const state: SyncedState = {
    userExtension,
    snapshot,
    status,
    setUserExtension: (patch) => queueUserExtensionWrite(patch),
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
      try {
        await browser.storage.local.set({ [USER_OPTIONS_KEY]: {} });
        setUserExtensionSignal({});
        return { ok: true };
      } catch {
        return { ok: false, reason: 'blocked' };
      }
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
