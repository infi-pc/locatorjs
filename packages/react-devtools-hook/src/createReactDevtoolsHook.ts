import {
  FiberRoot,
  ReactInternals,
  ReactDevtoolsHook,
} from "@locator/shared/src/types";
import { isValidRenderer } from "@locator/shared/dist/isValidRenderer";

declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__: ReactDevtoolsHook;
  }
}

export function createReactDevtoolsHook(existing: ReactDevtoolsHook) {
  const attachedRenderers = new Map<number, ReactInternals>();
  const fiberRoots = new Map<number, Set<FiberRoot>>();
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
          attachedRenderers.set(id, renderer);
          fiberRoots.set(id, new Set());
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

    // onScheduleRoot(rendererId, root, children) {},
    onCommitFiberUnmount(rendererId, fiber) {
      if (typeof existing.onCommitFiberUnmount === "function") {
        existing.onCommitFiberUnmount(rendererId, fiber);
      }

      //   const renderer = attachedRenderers.get(rendererId);
      //   if (renderer) {
      //     try {
      //       // console.log("handleCommitFiberUnmount");
      //       renderer.handleCommitFiberUnmount(fiber);
      //     } catch (e) {
      //       console.error('[locator-js]', e);
      //       // debugger;
      //     }
      //   }
    },

    onCommitFiberRoot(rendererId, root, priorityLevel) {
      if (typeof existing.onCommitFiberRoot === "function") {
        existing.onCommitFiberRoot(rendererId, root, priorityLevel);
      }

      //   const renderer = attachedRenderers.get(rendererId);
      //   const mountedRoots = fiberRoots.get(rendererId);
      //   if (!renderer || !mountedRoots) {
      //     return;
      //   }
      //   const isKnownRoot = mountedRoots.has(root);
      //   const current = root.current;
      //   const isUnmounting =
      //     current.memoizedState == null || current.memoizedState.element == null;
      //   // Keep track of mounted roots so we can hydrate when DevTools connect.
      //   if (!isKnownRoot && !isUnmounting) {
      //     mountedRoots.add(root);
      //   } else if (isKnownRoot && isUnmounting) {
      //     mountedRoots.delete(root);
      //   }
      //   try {
      //     // console.log("handleCommitFiberRoot");
      //     renderer.handleCommitFiberRoot(root, priorityLevel);
      //   } catch (e) {
      //     console.error('[locator-js]', e);
      //     // debugger;
      //   }
    },

    /**
     * React calls this method
     */
    onPostCommitFiberRoot(rendererId, root) {
      if (typeof existing.onPostCommitFiberRoot === "function") {
        existing.onPostCommitFiberRoot(rendererId, root);
      }

      //   const renderer = attachedRenderers.get(rendererId);
      //   if (renderer) {
      //     try {
      //       // console.log("handlePostCommitFiberRoot");
      //       renderer.handlePostCommitFiberRoot(root);
      //     } catch (e) {
      //       console.error('[locator-js]', e);
      //       // debugger;
      //     }
      //   }
    },
  };

  return reactDevtoolsHook;
}
