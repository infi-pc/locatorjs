/* eslint-disable solid/reactivity */
import { getModifiersMap, getModifiersString } from '@locator/shared';
import { createSignal, createContext, useContext, Accessor } from 'solid-js';
import browser from '../../browser';

type ControlsMap = { [key: string]: boolean };

type SyncedState = {
  clicks: Accessor<number>;
  target: { get: Accessor<string>; set: (target: string) => void };
  controls: {
    getMap: Accessor<ControlsMap>;
    getString: Accessor<string>;
    setControl: (key: string, value: boolean) => void;
  };
  allowTracking: {
    get: Accessor<boolean | null>;
    set: (target: boolean) => void;
  };
  sharedOnSocialMedia: {
    get: Accessor<string | null>;
    set: (target: string) => void;
  };
  enableExperimentalFeatures: {
    get: Accessor<boolean | null>;
    set: (target: boolean) => void;
  };
};

const SyncedStateContext = createContext<SyncedState>();

export function SyncedStateProvider(props: { children: any }) {
  const [state, setState] = createSignal<SyncedState | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  browser.storage.local
    .get([
      'clickCount',
      'target',
      'controls',
      'allowTracking',
      'sharedOnSocialMedia',
      'enableExperimentalFeatures',
    ])
    .then((result) => {
      const [clicks] = createSignal(result.clickCount || 0);
      const [sharedOnSocialMedia, setSharedOnSocialMedia] = createSignal<
        string | null
      >(result.sharedOnSocialMedia || null);
      const [target, setTarget] = createSignal<string>(
        result.target || 'vscode'
      );
      const [controls, setControls] = createSignal<string>(
        result.controls || 'alt'
      );
      const [allowTracking, setAllowTracking] = createSignal<boolean | null>(
        result.allowTracking ?? null
      );
      const [enableExperimentalFeatures, setEnableExperimentalFeatures] =
        createSignal<boolean | null>(result.enableExperimentalFeatures || null);

      const controlsMap = () => getModifiersMap(controls() || 'alt');

      setState({
        clicks,
        target: {
          get: target,
          set: (newTarget: string) => {
            browser.storage.local.set({ target: newTarget }, function () {
              // console.log('Value is set to ' + newTarget);
            });
            setTarget(newTarget);
          },
        },
        controls: {
          getMap: controlsMap,
          getString: controls,
          setControl: (control: string, enable: boolean) => {
            const map = controlsMap();
            if (enable) {
              map[control] = true;
            } else {
              delete map[control];
            }
            setControls(getModifiersString(map));
            browser.storage.local.set({ controls: getModifiersString(map) });
          },
        },
        allowTracking: {
          get: allowTracking,
          set: (newAllowTracking: boolean) => {
            setAllowTracking(newAllowTracking);
            browser.storage.local.set({ allowTracking: newAllowTracking });
          },
        },
        sharedOnSocialMedia: {
          get: sharedOnSocialMedia,
          set: (newValue: string) => {
            setSharedOnSocialMedia(newValue);
            browser.storage.local.set({ sharedOnSocialMedia: newValue });
          },
        },
        enableExperimentalFeatures: {
          get: enableExperimentalFeatures,
          set: (newValue: boolean) => {
            setEnableExperimentalFeatures(newValue);
            browser.storage.local.set({ enableExperimentalFeatures: newValue });
          },
        },
      });
    })
    .catch((e) => {
      setError(String(e));
    });

  return (
    <>
      {state() ? (
        <SyncedStateContext.Provider value={state()!}>
          {props.children}
        </SyncedStateContext.Provider>
      ) : error() ? (
        <>{error()}</>
      ) : (
        <>Loading...</>
      )}
    </>
  );
}

export function useSyncedState() {
  return useContext(SyncedStateContext)!;
}
