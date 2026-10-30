import { strictConfig } from "@locator/shared";

export type LayerViews = Partial<
  Record<strictConfig.LocatorLayerId, strictConfig.SerializedLayerV3>
>;

export const LAYER_ORDER: readonly strictConfig.LocatorLayerId[] = [
  "default",
  "team",
  "user-extension",
  "user-origin",
];

function targetRegistryFromView(
  targets: strictConfig.TargetViewMap
): strictConfig.TargetRegistry {
  const compiled = strictConfig.compileSetup({ targets });
  if (!compiled.ok) {
    throw new Error("ActionSettings received an invalid target registry.");
  }
  return compiled.value.targets;
}

export function strictLayersFromViews(
  layers: LayerViews
): Partial<Record<strictConfig.LocatorLayerId, strictConfig.LocatorLayer>> {
  const result: Partial<
    Record<strictConfig.LocatorLayerId, strictConfig.LocatorLayer>
  > = {};
  for (const [id, layer] of Object.entries(layers) as [
    strictConfig.LocatorLayerId,
    strictConfig.SerializedLayerV3 | undefined
  ][]) {
    if (!layer) continue;
    const parsed = strictConfig.parseLayer(layer);
    if (!parsed.ok) {
      throw new Error(`ActionSettings received an invalid ${id} layer.`);
    }
    result[id] = parsed.value;
  }
  return result;
}

export function resolveLayerViews(
  layers: LayerViews,
  targets: strictConfig.TargetViewMap
): strictConfig.ResolvedConfig {
  return strictConfig.resolveConfig(
    strictLayersFromViews(layers),
    targetRegistryFromView(targets)
  );
}

export function effectiveEditorDestination(
  editor: strictConfig.EffectiveEditor
): strictConfig.EditorDestination | undefined {
  if (editor.kind !== "selected") return undefined;
  return strictConfig.encodeEditorDestination(editor.destination);
}

export function layersThroughScope(
  layers: LayerViews,
  scope: strictConfig.LocatorLayerId
): LayerViews {
  const lastIndex = LAYER_ORDER.indexOf(scope);
  return Object.fromEntries(
    LAYER_ORDER.slice(0, lastIndex + 1)
      .filter((layer) => layers[layer] !== undefined)
      .map((layer) => [layer, layers[layer]])
  );
}
