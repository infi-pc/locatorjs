import { strictConfig } from "@locator/shared";
import {
  type LayerViews,
  resolveLayerViews,
  strictLayersFromViews,
} from "./configModel";

export type LayerFieldState<K extends strictConfig.ConfigField> = {
  setHere: boolean;
  source: strictConfig.LocatorLayerId;
  value: strictConfig.SerializedLayerV3[K] | undefined;
};

export function layerFieldState<K extends strictConfig.ConfigField>(
  layers: LayerViews,
  layer: strictConfig.LocatorLayerId,
  fieldKey: K,
  targets: strictConfig.TargetViewMap
): LayerFieldState<K> {
  const strictLayers = strictLayersFromViews(layers);
  const resolved = resolveLayerViews(layers, targets);
  const layerValues = strictLayers[layer] ?? strictConfig.EMPTY_LAYER;
  const effective = strictConfig.effectiveOptionsView(
    strictConfig.effectiveOptions(resolved)
  );
  const serializedEffective: strictConfig.SerializedLayerV3 = {
    ...(effective.adapter ? { adapter: effective.adapter } : {}),
    ...(effective.projectPath ? { projectPath: effective.projectPath } : {}),
    ...(effective.replacePath ? { replacePath: effective.replacePath } : {}),
    ...(effective.editor.kind === "selected"
      ? { editor: effective.editor.destination }
      : {}),
    bindings: effective.bindings,
    hrefTarget: effective.hrefTarget,
    ...(effective.tmuxSession ? { tmuxSession: effective.tmuxSession } : {}),
    disabled: effective.disabled,
    debugMode: effective.debugMode,
    showIntro: effective.showIntro,
  };
  return {
    setHere: layerValues[fieldKey] !== undefined,
    source: resolved.fields[fieldKey].source,
    value: serializedEffective[fieldKey],
  };
}
