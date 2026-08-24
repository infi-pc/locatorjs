import type { Binding, LocatorOptions } from '@locator/shared';

/** Settings safe to expose before the hook has identified a dev surface. */
export function safeFrameProjection(options: LocatorOptions): LocatorOptions {
  const bindings = options.bindings?.flatMap((binding): Binding[] => {
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
  });
  return {
    bindings,
    disabled: options.disabled,
    hrefTarget: options.hrefTarget,
    showIntro: options.showIntro,
    adapterId: options.adapterId,
  };
}
