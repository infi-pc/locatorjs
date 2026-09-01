import {
  createContext,
  createMemo,
  createSignal,
  onCleanup,
  untrack,
  useContext,
} from "solid-js";
import { mountRuntimePopupBridge } from "./popupBridge";
import { initOptions, type OptionsStore } from "./optionsStore";

const OptionsContext = createContext<OptionsStore>();

function reactiveOptions(store: OptionsStore): OptionsStore {
  const [revision, setRevision] = createSignal(0);
  const stop = store.subscribe(() => setRevision((current) => current + 1));
  onCleanup(stop);
  const trackAccessor = <T,>(accessor: () => T) => {
    const tracked = createMemo(() => {
      const trackedRevision = revision();
      void trackedRevision;
      return accessor();
    });
    return tracked;
  };
  return {
    ...store,
    effective: trackAccessor(store.effective),
    resolved: trackAccessor(store.resolved),
    provenance: trackAccessor(store.provenance),
    layers: trackAccessor(store.layers),
    uiState: trackAccessor(store.uiState),
    allTargets: trackAccessor(store.allTargets),
    targetRegistry: trackAccessor(store.targetRegistry),
    configRead: trackAccessor(store.configRead),
    editorWithheld: trackAccessor(store.editorWithheld),
  };
}

export function OptionsProvider(props: {
  children: any;
  store?: OptionsStore;
}) {
  const externalStore = untrack(() => props.store);
  const store = externalStore ?? initOptions();
  if (!externalStore) {
    const unmountPopupBridge = mountRuntimePopupBridge(store);
    onCleanup(() => {
      unmountPopupBridge();
      store.dispose();
    });
  }
  const options = reactiveOptions(store);

  return (
    <OptionsContext.Provider value={options}>
      {props.children}
    </OptionsContext.Provider>
  );
}

export function useOptions() {
  const options = useContext(OptionsContext);
  if (!options) throw new Error("Options context is not provided");
  return options;
}
