import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  getOwner,
  onCleanup,
  untrack,
  useContext,
} from "solid-js";
import {
  DEFAULT_LAYER,
  clearUserOriginOptions,
  getUserOriginOptions,
  getUserOriginUiState,
  listenOnUserOriginChanges,
  LocatorLayer,
  LocatorOptions,
  LocatorUserOriginStored,
  resolve,
  setUserOriginOptions,
  setUserOriginUiState,
  Targets,
  WriteResult,
  allTargets,
} from "@locator/shared";
import { setDebugMode } from "../adapters/react/debug";
import { getTeamLayerSignal, getTeamTargetsSignal } from "./teamLayerStore";
import { mountRuntimePopupBridge } from "./popupBridge";
import { readUserExtensionGlobal } from "./runtimeOptionsSnapshot";

export type UiState = NonNullable<LocatorUserOriginStored["uiState"]>;

export type OptionsStore = {
  effective: () => LocatorOptions;
  provenance: () => Partial<Record<keyof LocatorOptions, LocatorLayer>>;
  layers: () => Partial<Record<LocatorLayer, LocatorOptions>>;
  uiState: () => UiState;
  allTargets: () => Targets;
  editorWithheld: () => boolean;
  setUserOrigin: (patch: Partial<LocatorOptions>) => Promise<WriteResult>;
  clearUserOrigin: () => Promise<WriteResult>;
  setUiState: (patch: Partial<UiState>) => Promise<WriteResult>;
};

function readEditorWithheld(): boolean {
  return (
    typeof document !== "undefined" &&
    document.documentElement?.dataset?.locatorEditorWithheld === "true"
  );
}

export function initOptions(): OptionsStore {
  const teamLayer = getTeamLayerSignal();
  const teamTargets = getTeamTargetsSignal();

  const [userExtension, setUserExtension] = createSignal<
    LocatorOptions | undefined
  >(readUserExtensionGlobal());
  const [userOrigin, setUserOrigin] = createSignal<LocatorOptions>(
    getUserOriginOptions()
  );
  const [editorWithheld, setEditorWithheld] = createSignal(
    readEditorWithheld()
  );
  const [uiState, setUiState] = createSignal<UiState>(getUserOriginUiState());

  const layers = createMemo(
    (): Partial<Record<LocatorLayer, LocatorOptions>> => ({
      default: DEFAULT_LAYER,
      team: teamLayer(),
      "user-extension": userExtension(),
      "user-origin": userOrigin(),
    })
  );

  const resolved = createMemo(() => resolve(layers()));

  const effective = () => resolved().effective;
  const provenance = () => resolved().provenance;

  createEffect(() => {
    setDebugMode(effective().debugMode ?? false);
  });

  const stopListeningToUserOrigin = listenOnUserOriginChanges(() => {
    setUserOrigin(getUserOriginOptions());
    setUiState(getUserOriginUiState());
  });
  if (getOwner()) onCleanup(stopListeningToUserOrigin);

  if (typeof MutationObserver !== "undefined" && document.documentElement) {
    const observer = new MutationObserver(() => {
      setUserExtension(readUserExtensionGlobal());
      setEditorWithheld(readEditorWithheld());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [
        "data-locator-user-extension-options",
        "data-locator-editor-withheld",
      ],
    });
    if (getOwner()) {
      onCleanup(() => observer.disconnect());
    }
  }

  const store: OptionsStore = {
    effective,
    provenance,
    layers,
    uiState,
    allTargets: () => teamTargets() ?? allTargets,
    editorWithheld,
    setUserOrigin: async (patch) => {
      const result = setUserOriginOptions(patch);
      if (result.ok) {
        setUserOrigin(getUserOriginOptions());
      }
      return result;
    },
    clearUserOrigin: async () => {
      const result = clearUserOriginOptions();
      if (result.ok) {
        setUserOrigin({});
      }
      return result;
    },
    setUiState: async (patch) => {
      const result = setUserOriginUiState(patch);
      if (result.ok) {
        setUiState(getUserOriginUiState());
      }
      return result;
    },
  };

  if (typeof window !== "undefined") {
    window.enableLocator = () => store.setUserOrigin({ disabled: false });
  }

  return store;
}

const OptionsContext = createContext<OptionsStore>();

export function OptionsProvider(props: {
  children: any;
  store?: OptionsStore;
}) {
  const externalStore = untrack(() => props.store);
  const options = externalStore ?? initOptions();
  if (!externalStore) mountRuntimePopupBridge(options);

  return (
    <OptionsContext.Provider value={options}>
      {props.children}
    </OptionsContext.Provider>
  );
}

export function useOptions() {
  const options = useContext(OptionsContext);
  if (!options) {
    throw new Error("Options context is not provided");
  }
  return options;
}
