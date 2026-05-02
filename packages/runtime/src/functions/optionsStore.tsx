import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  getOwner,
  onCleanup,
  useContext,
} from "solid-js";
import {
  DEFAULT_LAYER,
  getUserProjectOptions,
  getUserProjectUiState,
  listenOnUserProjectChanges,
  LocatorLayer,
  LocatorOptions,
  LocatorUserProjectStored,
  resolve,
  setUserProjectOptions,
  setUserProjectUiState,
  Targets,
  WriteResult,
  allTargets,
} from "@locator/shared";
import { setDebugMode } from "../adapters/react/debug";
import { getTeamLayerSignal, getTeamTargetsSignal } from "./teamLayerStore";
import { mountRuntimePopupBridge } from "./popupBridge";

export type UiState = NonNullable<LocatorUserProjectStored["uiState"]>;

export type OptionsStore = {
  effective: () => LocatorOptions;
  provenance: () => Partial<Record<keyof LocatorOptions, LocatorLayer>>;
  uiState: () => UiState;
  allTargets: () => Targets;
  setUserProject: (patch: Partial<LocatorOptions>) => Promise<WriteResult>;
  setUiState: (patch: Partial<UiState>) => Promise<WriteResult>;
};

function readUserExtensionGlobal(): LocatorOptions | undefined {
  const raw = (globalThis as Record<string, unknown>)
    .__LOCATOR_USER_EXTENSION_OPTIONS__;
  if (raw && typeof raw === "object") {
    return raw as LocatorOptions;
  }
  return undefined;
}

export function initOptions(): OptionsStore {
  const teamLayer = getTeamLayerSignal();
  const teamTargets = getTeamTargetsSignal();

  const [userExtension, setUserExtension] = createSignal<
    LocatorOptions | undefined
  >(readUserExtensionGlobal());
  const [userProject, setUserProject] = createSignal<LocatorOptions>(
    getUserProjectOptions()
  );
  const [uiState, setUiState] = createSignal<UiState>(getUserProjectUiState());

  const resolved = createMemo(() =>
    resolve({
      default: DEFAULT_LAYER,
      team: teamLayer(),
      "user-extension": userExtension(),
      "user-project": userProject(),
    })
  );

  const effective = () => resolved().effective;
  const provenance = () => resolved().provenance;

  createEffect(() => {
    setDebugMode(effective().debugMode ?? false);
  });

  listenOnUserProjectChanges(() => {
    setUserProject(getUserProjectOptions());
    setUiState(getUserProjectUiState());
  });

  if (typeof window !== "undefined") {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== window) return;
      const data = event.data;
      if (!data || typeof data !== "object") return;
      if (data.type === "LOCATOR_USER_EXTENSION_OPTIONS_UPDATED") {
        setUserExtension(readUserExtensionGlobal());
      }
      if (data.type === "LOCATOR_EXTENSION_UPDATED_OPTIONS") {
        setUserProject(getUserProjectOptions());
        setUiState(getUserProjectUiState());
      }
    };
    window.addEventListener("message", onMessage, false);
    if (getOwner()) {
      onCleanup(() => {
        window.removeEventListener("message", onMessage, false);
      });
    }
  }

  const store: OptionsStore = {
    effective,
    provenance,
    uiState,
    allTargets: () => teamTargets() ?? allTargets,
    setUserProject: async (patch) => {
      const result = setUserProjectOptions(patch);
      if (result.ok) {
        setUserProject(getUserProjectOptions());
      }
      return result;
    },
    setUiState: async (patch) => {
      const result = setUserProjectUiState(patch);
      if (result.ok) {
        setUiState(getUserProjectUiState());
      }
      return result;
    },
  };

  if (typeof window !== "undefined") {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.enableLocator = () => {
      store.setUserProject({ disabled: false });
      return "Locator enabled";
    };
  }

  return store;
}

const OptionsContext = createContext<OptionsStore>();

export function OptionsProvider(props: { children: any }) {
  const options = initOptions();
  mountRuntimePopupBridge(options);

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
