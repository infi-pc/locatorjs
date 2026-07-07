/* eslint-disable solid/reactivity */
import {
  createSignal,
  createContext,
  useContext,
  Accessor,
  JSX,
} from 'solid-js';
import type {
  LocatorOptions,
  LocatorLayer,
  Targets,
  WriteResult,
} from '@locator/shared';
import browser from '../../browser';

const USER_OPTIONS_KEY = 'userOptions';

export type Snapshot = {
  effective: LocatorOptions;
  provenance: Partial<Record<keyof LocatorOptions, LocatorLayer>>;
  allTargets: Targets;
};

export type ConnectivityStatus = 'loading' | 'connected' | 'no-runtime';

type SyncedState = {
  userExtension: Accessor<LocatorOptions>;
  snapshot: Accessor<Snapshot | null>;
  status: Accessor<ConnectivityStatus>;
  setUserExtension: (patch: Partial<LocatorOptions>) => Promise<WriteResult>;
  setSiteLocal: (patch: Partial<LocatorOptions>) => Promise<WriteResult>;
  refresh: () => void;
};

const SyncedStateContext = createContext<SyncedState>();

export function SyncedStateProvider(props: { children: JSX.Element }) {
  const [userExtension, setUserExtensionSignal] = createSignal<LocatorOptions>(
    {}
  );
  const [snapshot, setSnapshot] = createSignal<Snapshot | null>(null);
  const [status, setStatus] = createSignal<ConnectivityStatus>('loading');
  const [ready, setReady] = createSignal(false);

  browser.storage.local.get([USER_OPTIONS_KEY]).then((result) => {
    const stored = (result?.[USER_OPTIONS_KEY] ?? {}) as LocatorOptions;
    setUserExtensionSignal(stored);
    setReady(true);
  });

  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    if (USER_OPTIONS_KEY in changes) {
      const next = (changes[USER_OPTIONS_KEY].newValue ?? {}) as LocatorOptions;
      setUserExtensionSignal(next);
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
      const response = (await browser.tabs.sendMessage(currentTab.id, {
        from: 'popup',
        subject: 'requestSnapshot',
      })) as
        | { ok: true; snapshot: Snapshot }
        | { ok: false; reason: string }
        | undefined;
      if (response?.ok) {
        setSnapshot(response.snapshot);
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
  // cleanup isn't critical here — popup window closes and state is gone
  void refreshInterval;

  const state: SyncedState = {
    userExtension,
    snapshot,
    status,
    setUserExtension: async (patch) => {
      const current = userExtension();
      const next = { ...current, ...patch };
      // Strip undefined to keep storage clean
      for (const key of Object.keys(next) as (keyof LocatorOptions)[]) {
        if (next[key] === undefined) delete next[key];
      }
      try {
        await browser.storage.local.set({ [USER_OPTIONS_KEY]: next });
        setUserExtensionSignal(next);
        return { ok: true };
      } catch (e) {
        return { ok: false, reason: 'blocked' };
      }
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
        const response = (await browser.tabs.sendMessage(currentTab.id, {
          from: 'popup',
          subject: 'applySiteLocal',
          patch,
        })) as WriteResult | undefined;
        if (!response) {
          return { ok: false, reason: 'blocked' };
        }
        requestSnapshot();
        return response;
      } catch {
        return { ok: false, reason: 'blocked' };
      }
    },
    refresh: requestSnapshot,
  };

  return (
    <>
      {ready() ? (
        <SyncedStateContext.Provider value={state}>
          {props.children}
        </SyncedStateContext.Provider>
      ) : (
        <>Loading...</>
      )}
    </>
  );
}

export function useSyncedState() {
  const ctx = useContext(SyncedStateContext);
  if (!ctx) throw new Error('SyncedStateContext not provided');
  return ctx;
}
