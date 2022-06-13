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
};

const SyncedStateContext = createContext<SyncedState>();

export function SyncedStateProvider(props: { children: any }) {
  const [state, setState] = createSignal<SyncedState | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  browser.storage.local
    .get(['clickCount', 'target', 'controls', 'allowTracking'])
    .then((result) => {
      const [clicks] = createSignal(result.clickCount || 0);
      const [target, setTarget] = createSignal(result.target || 'vscode');
      const [controls, setControls] = createSignal(result.controls || 'alt');
      const [allowTracking, setAllowTracking] = createSignal(
        result.allowTracking ?? null
      );
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
