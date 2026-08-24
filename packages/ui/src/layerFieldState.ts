import {
  normalizeLayer,
  resolve,
  type LocatorLayer,
  type LocatorOptions,
} from "@locator/shared";

export type LayerFieldState<K extends keyof LocatorOptions> = {
  /** The layer being edited sets this field itself, so it can be reverted. */
  setHere: boolean;
  /** Which layer the effective value comes from. */
  source: LocatorLayer | undefined;
  value: LocatorOptions[K];
};

function normalizedLayers(
  layers: Partial<Record<LocatorLayer, LocatorOptions>>
) {
  return Object.fromEntries(
    Object.entries(layers).map(([layer, options]) => [
      layer,
      normalizeLayer(options),
    ])
  ) as Partial<Record<LocatorLayer, LocatorOptions>>;
}

export function layerFieldState<K extends keyof LocatorOptions>(
  layers: Partial<Record<LocatorLayer, LocatorOptions>>,
  layer: LocatorLayer,
  fieldKey: K
): LayerFieldState<K> {
  const normalized = normalizedLayers(layers);
  const resolved = resolve(normalized);
  const layerValues = normalized[layer] ?? {};
  return {
    setHere: layerValues[fieldKey] !== undefined,
    source: resolved.provenance[fieldKey],
    value: resolved.effective[fieldKey],
  };
}
