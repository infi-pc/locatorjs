import type { strictConfig as StrictConfig } from '@locator/shared';

/** Settings safe to expose before the hook has identified a dev surface. */
export function safeFrameProjection(
  layer: StrictConfig.SerializedLayerV3
): StrictConfig.SerializedLayerV3 {
  const bindings = layer.bindings?.flatMap(
    (binding): StrictConfig.BindingInput[] => {
      const trigger = binding.trigger;
      switch (binding.action.kind) {
        case 'open-editor':
          return [{ trigger, action: { kind: 'open-editor' } }];
        case 'copy-path':
        case 'show-tree':
        case 'show-parents':
          return [{ trigger, action: { kind: binding.action.kind } }];
        case 'copy-prompt':
        case 'open-prompt':
          return [];
      }
    }
  );
  return {
    ...(bindings ? { bindings } : {}),
    ...(layer.disabled !== undefined ? { disabled: layer.disabled } : {}),
    ...(layer.hrefTarget !== undefined ? { hrefTarget: layer.hrefTarget } : {}),
    ...(layer.showIntro !== undefined ? { showIntro: layer.showIntro } : {}),
    ...(layer.adapter !== undefined ? { adapter: layer.adapter } : {}),
  };
}
