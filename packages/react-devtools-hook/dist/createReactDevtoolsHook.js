"use strict";
exports.__esModule = true;
exports.createReactDevtoolsHook = void 0;
var isValidRenderer_1 = require("./isValidRenderer");
function createReactDevtoolsHook(existing) {
    var attachedRenderers = new Map();
    var fiberRoots = new Map();
    var rendererSeedId = 0;
    // Not used. It is declared to follow React Devtools hook's behaviour
    // in order for other tools like react-render to work
    var renderers = new Map();
    var reactDevtoolsHook = {
        // This is a legacy flag.
        // React v16 checks the hook for this to ensure DevTools is new enough.
        supportsFiber: true,
        // Not used. It is declared to follow React Devtools hook's behaviour
        // in order for other tools like react-refresh to work
        // see https://github.com/facebook/react/blob/4ff5f5719b348d9d8db14aaa49a48532defb4ab7/packages/react-refresh/src/ReactFreshRuntime.js#L509
        renderers: renderers,
        inject: function (renderer) {
            var _a, _b;
            var id = ++rendererSeedId;
            if (typeof existing.inject === "function") {
                var prevSize = (_a = existing.renderers) === null || _a === void 0 ? void 0 : _a.size;
                id = existing.inject(renderer);
                // Vite plugin from some reason doesn't set the Map with renderers, so we do it manually
                if (((_b = existing.renderers) === null || _b === void 0 ? void 0 : _b.size) === prevSize) {
                    renderers.set(id, renderer);
                }
            }
            else {
                // Follow React Devtools hook's behaviour in order for other tools
                // like react-render to work
                renderers.set(id, renderer);
            }
            if ((0, isValidRenderer_1.isValidRenderer)(renderer)) {
                if (attachedRenderers.size === 0) {
                    attachedRenderers.set(id, renderer);
                    fiberRoots.set(id, new Set());
                }
                else {
                    console.warn("[locator-js] Only one React instance per page is supported for now, but one more React instance (".concat(renderer.rendererPackageName, " v").concat(renderer.version, ") was detected"));
                }
            }
            else {
                console.warn("[locator-js] React instance (".concat(renderer.rendererPackageName, " v").concat(renderer.version, ") is not supported"));
            }
            return id;
        },
        // onScheduleRoot(rendererId, root, children) {},
        onCommitFiberUnmount: function (rendererId, fiber) {
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
        onCommitFiberRoot: function (rendererId, root, priorityLevel) {
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
        onPostCommitFiberRoot: function (rendererId, root) {
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
        }
    };
    return reactDevtoolsHook;
}
exports.createReactDevtoolsHook = createReactDevtoolsHook;
