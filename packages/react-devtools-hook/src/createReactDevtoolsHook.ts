import { ReactInternals, ReactDevtoolsHook } from "@locator/shared";
import { isValidRenderer } from "@locator/shared";

declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__: ReactDevtoolsHook;
  }
}

export function createReactDevtoolsHook(existing: ReactDevtoolsHook) {
  const attachedRenderers = new Set<ReactInternals>();
  let rendererSeedId = 0;

  // Not used. It is declared to follow React Devtools hook's behaviour
  // in order for other tools like react-render to work
  const renderers = new Map<number, ReactInternals>();

  const reactDevtoolsHook: ReactDevtoolsHook = {
    // This is a legacy flag.
    // React v16 checks the hook for this to ensure DevTools is new enough.
    supportsFiber: true,

    // Not used. It is declared to follow React Devtools hook's behaviour
    // in order for other tools like react-refresh to work
    // see https://github.com/facebook/react/blob/4ff5f5719b348d9d8db14aaa49a48532defb4ab7/packages/react-refresh/src/ReactFreshRuntime.js#L509
    renderers,

    inject(renderer) {
      let id = ++rendererSeedId;

      if (typeof existing.inject === "function") {
        const prevSize = existing.renderers?.size;
        id = existing.inject(renderer);

        // Vite plugin from some reason doesn't set the Map with renderers, so we do it manually
        if (existing.renderers?.size === prevSize) {
          renderers.set(id, renderer);
        }
      } else {
        // Follow React Devtools hook's behaviour in order for other tools
        // like react-render to work
        renderers.set(id, renderer);
      }

      if (isValidRenderer(renderer)) {
        if (attachedRenderers.size === 0) {
          attachedRenderers.add(renderer);
        } else {
          console.warn(
            `[locator-js] Only one React instance per page is supported for now, but one more React instance (${renderer.rendererPackageName} v${renderer.version}) was detected`
          );
        }
      } else {
        console.warn(
          `[locator-js] React instance (${renderer.rendererPackageName} v${renderer.version}) is not supported`
        );
      }

      return id;
    },

    onCommitFiberUnmount(rendererId, fiber) {
      if (typeof existing.onCommitFiberUnmount === "function") {
        existing.onCommitFiberUnmount(rendererId, fiber);
      }
    },

    onCommitFiberRoot(rendererId, root, priorityLevel) {
      if (typeof existing.onCommitFiberRoot === "function") {
        existing.onCommitFiberRoot(rendererId, root, priorityLevel);
      }
    },

    /**
     * React calls this method
     */
    onPostCommitFiberRoot(rendererId, root) {
      if (typeof existing.onPostCommitFiberRoot === "function") {
        existing.onPostCommitFiberRoot(rendererId, root);
      }
    },
  };

  return reactDevtoolsHook;
}
