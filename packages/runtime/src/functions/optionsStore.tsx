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

export type UiState = NonNullable<LocatorUserOriginStored["uiState"]>;

export type OptionsStore = {
  effective: () => LocatorOptions;
  provenance: () => Partial<Record<keyof LocatorOptions, LocatorLayer>>;
  uiState: () => UiState;
  allTargets: () => Targets;
  setUserOrigin: (patch: Partial<LocatorOptions>) => Promise<WriteResult>;
  setUiState: (patch: Partial<UiState>) => Promise<WriteResult>;
};

function readUserExtensionGlobal(): LocatorOptions | undefined {
  if (typeof document === "undefined") return undefined;
  const raw = document.documentElement?.dataset?.locatorUserExtensionOptions;
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as LocatorOptions;
    }
  } catch {
    // ignore corrupt JSON
  }
  return undefined;
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
  const [uiState, setUiState] = createSignal<UiState>(getUserOriginUiState());

  const resolved = createMemo(() =>
    resolve({
      default: DEFAULT_LAYER,
      team: teamLayer(),
      "user-extension": userExtension(),
      "user-origin": userOrigin(),
    })
  );

  const effective = () => resolved().effective;
  const provenance = () => resolved().provenance;

  createEffect(() => {
    setDebugMode(effective().debugMode ?? false);
  });

  listenOnUserOriginChanges(() => {
    setUserOrigin(getUserOriginOptions());
    setUiState(getUserOriginUiState());
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
        setUserOrigin(getUserOriginOptions());
        setUiState(getUserOriginUiState());
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
    setUserOrigin: async (patch) => {
      const result = setUserOriginOptions(patch);
      if (result.ok) {
        setUserOrigin(getUserOriginOptions());
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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.enableLocator = () => {
      store.setUserOrigin({ disabled: false });
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
