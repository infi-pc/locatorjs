import { strictConfig, strictConfigStorage } from "@locator/shared";
import { setDebugMode } from "../adapters/react/debug";
import { getTeamConfig, listenToTeamConfigChanges } from "./teamLayerStore";
import { readUserExtensionGlobal } from "./runtimeOptionsSnapshot";

export type UiState = strictConfigStorage.UiState;

export type OptionsStore = {
  effective: () => strictConfig.EffectiveOptions;
  resolved: () => strictConfig.ResolvedConfig;
  provenance: () => Readonly<
    Record<strictConfig.ConfigField, strictConfig.LocatorLayerId>
  >;
  layers: () => Partial<
    Record<strictConfig.LocatorLayerId, strictConfig.SerializedLayerV3>
  >;
  uiState: () => UiState;
  allTargets: () => strictConfig.TargetViewMap;
  targetRegistry: () => strictConfig.TargetRegistry;
  configRead: () => strictConfig.ConfigReadResult;
  editorWithheld: () => boolean;
  setUserOrigin: (
    patch: strictConfig.LayerPatchInput
  ) => Promise<strictConfigStorage.WriteResult>;
  clearUserOrigin: () => Promise<strictConfigStorage.WriteResult>;
  setUiState: (
    patch: Partial<UiState>
  ) => Promise<strictConfigStorage.WriteResult>;
  subscribe: (listener: () => void) => () => void;
  dispose: () => void;
};

type DerivedState = Readonly<{
  effective: strictConfig.EffectiveOptions;
  resolved: strictConfig.ResolvedConfig;
  provenance: Readonly<
    Record<strictConfig.ConfigField, strictConfig.LocatorLayerId>
  >;
  layers: Partial<
    Record<strictConfig.LocatorLayerId, strictConfig.SerializedLayerV3>
  >;
  targets: strictConfig.TargetRegistry;
  targetView: strictConfig.TargetViewMap;
}>;

function readEditorWithheld(): boolean {
  return (
    typeof document !== "undefined" &&
    document.documentElement?.dataset?.locatorEditorWithheld === "true"
  );
}

function deriveState(
  userExtension: strictConfig.LocatorLayer | undefined,
  userOrigin: strictConfigStorage.UserConfigSnapshot | null
): DerivedState {
  const team = getTeamConfig();
  const strictLayers: Partial<
    Record<strictConfig.LocatorLayerId, strictConfig.LocatorLayer>
  > = {
    default: strictConfig.DEFAULT_LAYER,
    team: team.layer,
    "user-extension": userExtension,
    ...(userOrigin ? { "user-origin": userOrigin.layer } : {}),
  };
  const resolved = strictConfig.resolveConfig(strictLayers, team.targets);
  const layers: Partial<
    Record<strictConfig.LocatorLayerId, strictConfig.SerializedLayerV3>
  > = {};
  for (const [id, layer] of Object.entries(strictLayers) as [
    strictConfig.LocatorLayerId,
    strictConfig.LocatorLayer | undefined
  ][]) {
    if (layer) layers[id] = strictConfig.encodeLayer(layer);
  }
  return Object.freeze({
    effective: strictConfig.effectiveOptions(resolved),
    resolved,
    provenance: strictConfig.configProvenance(resolved),
    layers: Object.freeze(layers),
    targets: team.targets,
    targetView: strictConfig.targetRegistryView(team.targets),
  });
}

/**
 * Framework-free observable store used by the startup shell. The Solid adapter
 * is kept in optionsContext.tsx, which belongs to the lazily loaded UI chunk.
 */
export function initOptions(): OptionsStore {
  let userExtension = readUserExtensionGlobal();
  let userRead = strictConfigStorage.readUserConfig();
  let userOrigin = strictConfigStorage.snapshotFromRead(userRead);
  let editorWithheld = readEditorWithheld();
  let uiState = strictConfigStorage.readUiState();
  let derived = deriveState(userExtension, userOrigin);
  let disposed = false;
  const listeners = new Set<() => void>();

  const refresh = () => {
    if (disposed) return;
    derived = deriveState(userExtension, userOrigin);
    setDebugMode(derived.effective.debugMode);
    for (const listener of [...listeners]) listener();
  };
  setDebugMode(derived.effective.debugMode);

  const stopListeningToUserOrigin =
    strictConfigStorage.listenOnUserConfigChanges((nextRead) => {
      userRead = nextRead;
      userOrigin = strictConfigStorage.snapshotFromRead(nextRead);
      uiState = strictConfigStorage.readUiState();
      refresh();
    });
  const stopListeningToTeamConfig = listenToTeamConfigChanges(refresh);

  let observer: MutationObserver | undefined;
  if (typeof MutationObserver !== "undefined" && document.documentElement) {
    observer = new MutationObserver(() => {
      userExtension = readUserExtensionGlobal();
      editorWithheld = readEditorWithheld();
      refresh();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [
        "data-locator-user-extension-options",
        "data-locator-editor-withheld",
      ],
    });
  }

  const store: OptionsStore = {
    effective: () => derived.effective,
    resolved: () => derived.resolved,
    provenance: () => derived.provenance,
    layers: () => derived.layers,
    uiState: () => uiState,
    allTargets: () => derived.targetView,
    targetRegistry: () => derived.targets,
    configRead: () => userRead,
    editorWithheld: () => editorWithheld,
    setUserOrigin: async (patch) => {
      const result = strictConfigStorage.patchUserConfig(patch);
      if (result.ok) {
        userRead = Object.freeze({
          kind: "ready" as const,
          revision: result.snapshot.revision,
          layer: result.snapshot.layer,
        });
        userOrigin = result.snapshot;
        refresh();
        return Object.freeze({ ok: true });
      }
      return result;
    },
    clearUserOrigin: async () => {
      const result = strictConfigStorage.clearUserConfig();
      if (result.ok) {
        userRead = Object.freeze({ kind: "empty" });
        userOrigin = null;
        refresh();
        return Object.freeze({ ok: true });
      }
      return result;
    },
    setUiState: async (patch) => {
      const result = strictConfigStorage.patchUiState(patch);
      if (result.ok) {
        uiState = strictConfigStorage.readUiState();
        refresh();
      }
      return result;
    },
    subscribe: (listener) => {
      if (disposed) return () => undefined;
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      listeners.clear();
      stopListeningToUserOrigin();
      stopListeningToTeamConfig();
      observer?.disconnect();
      if (typeof window !== "undefined" && window.enableLocator === enable) {
        delete (window as Partial<Window>).enableLocator;
      }
    },
  };

  const enable = () => store.setUserOrigin({ set: { disabled: false } });
  if (typeof window !== "undefined") window.enableLocator = enable;

  return store;
}
