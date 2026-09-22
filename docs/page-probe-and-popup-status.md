# Page probe and popup status

Make the extension independent of the React DevTools hook, detect every
supported framework the same way, and replace the popup's status text with a
small set of screens that tell the user exactly what is going on and what to do
next.

This document is the research and the plan. It stays as the reference for how
detection works once the work lands.

## Why

Reported in [PR #208](https://github.com/infi-pc/locatorjs/pull/208#issuecomment-5673816599):
with the v2 extension enabled, React DevTools' Components panel hangs on
"Loading React Element Tree…". Disabling LocatorJS fixes it.

### Root cause

`apps/extension/src/pages/Hook/index.ts` calls `installReactDevtoolsHook()`
from a `world: MAIN`, `run_at: document_start` content script (introduced in
#221; on `master` the hook was a `<script>` tag injected by the content script,
which always ran _after_ React DevTools). React DevTools installs its hook the
same way, so the order between the two extensions is a coin flip. When LocatorJS
wins it defines `window.__REACT_DEVTOOLS_GLOBAL_HOOK__` as a non-configurable,
getter-only property holding a five-property shim. React DevTools' `installHook`
starts with `if (target.hasOwnProperty('__REACT_DEVTOOLS_GLOBAL_HOOK__')) return null;`
and gives up. Its detection still sees `hook.renderers.size > 0` (our shim fills
the map), so the Components tab appears, but no backend ever attaches.

### What the hook is actually used for today

| Site                                                                                       | Reads                                      | Needed?                                                                                                                                                             |
| ------------------------------------------------------------------------------------------ | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/runtime/src/adapters/react/findFiberByHtmlElement.ts`                            | `renderer.findFiberByHostInstance`         | No. Falls back to the `__reactFiber$…` expando react-dom puts on every host node (17+; `__reactInternalInstance$` on 16). That is the lookup react-dom itself uses. |
| `clickSourceResolver.ts` steps 1–5, 7                                                      | `_debugStack`, `_debugOwner`, `_debugInfo` | No. Fiber fields.                                                                                                                                                   |
| `clickSourceResolver.ts` `getFirstRendererInterface`                                       | `hook.rendererInterfaces`                  | Only the **real** DevTools hook has this. Our shim never creates it; by winning the race we destroy this path.                                                      |
| `clickSourceResolver.ts` `getSourceFromDevTools`                                           | `renderer.getSourceForFiber`               | Dead. react-dom's injected internals never had that method.                                                                                                         |
| `packages/react-devtools-hook` `attachedRenderers`, `onCommit*` wrappers                   | —                                          | Dead. `attachedRenderers` is never read; the wrappers are pass-throughs.                                                                                            |
| `packages/shared/src/environmentDetection.ts` `detectReact`, `Hook/insertRuntimeScript.ts` | `hook.renderers` + `isValidRenderer`       | **The last load-bearing use.** React calls `hook.inject(internals)` once when react-dom evaluates, so the hook must exist _before_ that — hence document_start.     |

So the whole document_start/MAIN-world hook exists to answer "is a dev build of
react-dom on this page?", and that question can be answered from the DOM after
render instead. Verified against `react-dom@19.2.0`:

- `__reactFiber$<random>` on host nodes and `__reactContainer$<random>` on the
  root container, in both dev and prod builds.
- `fiber._debugOwner` is assigned in the dev `FiberNode` constructor and does
  not appear anywhere in the production bundle. Its presence as an own property
  is a reliable dev/prod signal, equivalent to `bundleType === 1`.
- `_debugStack` (19.1+) carries the JSX call-site; it is what the resolver
  already uses.

A side effect worth knowing: the npm `@locator/runtime` never installs a hook,
so in the Playwright fixtures `detectReact()` is always false and `getAdapter`
falls through to the **jsx** adapter. The fiber-based react adapter is only
reachable with React DevTools or the extension shim present, and has no e2e
coverage without one.

## Unified detection: one probe for every framework

Each framework leaves dev-only metadata on DOM nodes. Detection becomes a
single pure function that samples the DOM and returns structured evidence; the
extension gate and the runtime's `getAdapter` both call it.

| Framework         | Present                                                 | Dev metadata (what the adapter needs)                                | Verified in                                                     |
| ----------------- | ------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------- |
| React             | element own key `__reactFiber$*` / `__reactContainer$*` | `"_debugOwner" in fiber`                                             | `react-dom@19.2.0` dev/prod bundles                             |
| Vue 3             | `window.__VUE__` (set in prod too), `__vnode` on nodes  | `"__vueParentComponent" in element` (dev or `__VUE_PROD_DEVTOOLS__`) | `@vue/runtime-core@3.5.32` `baseCreateRenderer`, `mountElement` |
| Svelte            | `[class*="svelte-"]` hint only                          | `element.__svelte_meta.loc` (compiler `dev: true`)                   | `svelte@3.59.2` `internal/index.mjs` `add_location`             |
| JSX (babel-jsx)   | `[data-locatorjs-id], [data-locatorjs]`                 | same attribute, plus `window.__LOCATOR_DATA__` for old format        | `packages/babel-jsx`                                            |
| Unsupported hints | `[ng-version]` (Angular), `#___gatsby`, etc.            | —                                                                    | used only for copy in the popup                                 |

Notes that shape the implementation:

- Expando properties are invisible from the isolated content-script world, so
  the probe must run in the **MAIN** world. The existing MAIN-world script keeps
  that role (it also owns `attachShadow` tracking, which genuinely needs
  document_start). It just stops touching `__REACT_DEVTOOLS_GLOBAL_HOOK__`.
- Vue defines `__vueParentComponent` with `enumerable: false`, so use the `in`
  operator, not `Object.keys`. React uses plain assignment; `Object.keys` works
  and is what `findFiberByHtmlElement` does today.
- `window.__VUE__` is `true` in production builds. Today's `detectVue()` would
  select the Vue adapter on a prod page and then find nothing. The probe reports
  that as "Vue, production build".
- `window.__SVELTE_HMR` only exists with `svelte-hmr`. `__svelte_meta` is the
  real requirement and is what the adapter reads.
- Sample, don't scan: walk at most ~1500 elements with a `TreeWalker` from
  `document.body` (plus tracked shadow roots), stop at the first positive hit
  per framework. Attribute-based checks use `querySelector`. Budget: well under
  5 ms on a large page; the probe re-runs on DOM changes so it must be cheap.

### Result shape

```ts
type FrameworkId = "react" | "vue" | "svelte" | "jsx";

type FrameworkEvidence = {
  id: FrameworkId;
  /** Something from this framework is rendering on the page. */
  present: boolean;
  /** The dev-only metadata the adapter needs is actually on the nodes. */
  sourceInfo: boolean;
};

type PageProbe = {
  frameworks: FrameworkEvidence[];
  /** Best-effort names of frameworks Locator does not support, for copy only. */
  unsupported: string[];
  /** Whether `document.body` had any element children when probed. */
  rendered: boolean;
};
```

Adapter choice derives from the probe with a fixed priority: **jsx → svelte →
vue → react**. Explicit instrumentation wins over inference, which also keeps
`getElementInfo`'s existing order and means the React fixtures that use
babel-jsx keep exercising the jsx adapter in e2e, exactly as today. A fixed
`adapter` setting still overrides everything.

## Page status: one enum from probe to popup

The MAIN-world script derives a `PageStatus` from the probe and its own
injection state, and publishes it as versioned JSON on
`document.documentElement.dataset.locatorPageStatus`. The content script reads
it (the isolated world can read attributes), validates the shape, and includes
it in every popup response. The popup renders from the enum, never from free
text.

```ts
type PageStatus =
  | { kind: "probing" } // before first render / grace period
  | { kind: "ready"; adapter: FrameworkId; frameworks: FrameworkId[] }
  | { kind: "disabled"; adapter: FrameworkId } // user disabled Locator here
  | { kind: "no-framework"; unsupported: string[] }
  | { kind: "production-build"; frameworks: FrameworkId[] }
  | { kind: "missing-source-info"; frameworks: FrameworkId[] }
  | { kind: "client-failed"; detail: string }; // client.bundle.js did not load
```

The popup adds the states it can only know itself:

- `restricted-page` — no content script answered (chrome://, store, PDF,
  file:// without permission). Today: "Page not connected".
- `reload-required` — extension updated under the tab (exists today).
- `runtime-unreachable` — status says `ready` but the snapshot bridge timed
  out (HMR reload, frozen tab). Shown as a soft warning, not a hard error.

### Probe timing

Today: `DOMContentLoaded`, then retries at 1/2/5/8/12 s, then silence — a dev
server that compiles for 15 s lands on a stale "not found". Replace with:

1. Probe on `DOMContentLoaded` and on `load`.
2. A `MutationObserver` on `documentElement` (`childList`, `subtree`),
   debounced to at most one probe per 500 ms, disconnected once the status is
   `ready`/`production-build`/`missing-source-info` or after 90 s.
3. The popup's **Check again** button requests a fresh probe: popup →
   content script → `postMessage` → MAIN world → re-probe and republish.
4. `probing` turns into `no-framework` only after `rendered` is true and at
   least 3 s have passed since `DOMContentLoaded`, so a slow first paint does
   not flash the wrong screen.

### Screens

Minimal by default: when everything works the popup shows the settings and a
one-line footer, nothing else. Every other state is a single card at the top
with one sentence of diagnosis, one sentence of next step, and at most one
button. All copy lives in one place (`packages/ui/src/PageStatusCard.tsx`) so
it can be reviewed in ui-lab.

| State                 | Headline                                   | Body / action                                                                                                                                                                                     |
| --------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ready`               | _(no card)_                                | Footer: `Connected · React · localhost:3000`. Settings editor as today.                                                                                                                           |
| `disabled`            | Disabled on this page                      | **Enable** (exists today).                                                                                                                                                                        |
| `probing`             | Looking for your app…                      | Subtle, no spinner. "Locator checks the page once it renders." Settings for **All sites** remain editable underneath.                                                                             |
| `no-framework`        | No supported framework on this page        | "Locator works with React, Preact, Solid, Vue and Svelte apps running in development." If `unsupported` has a name: "This looks like an Angular app." **Check again** · link _Setup guides_.      |
| `production-build`    | React is here, but it's a production build | "Source locations only exist in development builds. Start the dev server (for example `npm run dev`) and open that URL." **Check again**.                                                         |
| `missing-source-info` | Svelte is running without source locations | Per framework: Svelte → enable `dev: true`; React → dev build without `_debugOwner` is not expected, point at setup guide; Vue → `__file` missing, mention SFC/dev. Link to the exact guide page. |
| `client-failed`       | Locator couldn't start on this page        | "The page blocked Locator's script (usually a strict Content-Security-Policy)." **Retry** · _Details_ disclosure with the raw error.                                                              |
| `restricted-page`     | Locator can't run here                     | "Browsers block extensions on this kind of page." No button. Settings for **All sites** remain editable.                                                                                          |
| `reload-required`     | Reload to finish updating Locator          | **Reload page** (exists today).                                                                                                                                                                   |
| `runtime-unreachable` | Page didn't answer                         | Footer-level warning: "Locator is on this page but didn't answer. Editing All sites until it does." Auto-clears on the next successful poll.                                                      |

The "Editing All sites offline" behaviour stays: the settings editor is always
mounted (see the comment in `Popup.tsx` about why it must not remount), and the
status card only explains why **This site** is not writable right now.

## Plan

Each phase is one commit; the PR targets `v2`.

### Phase 1 — shared probe, runtime consumes it

- Add `packages/shared/src/pageProbe.ts`: `probePage(document, shadowRoots?)`
  and `chooseAdapter(probe)`. Unit tests in jsdom with synthetic markers:
  React dev (`__reactFiber$x` + `_debugOwner`), React prod (no `_debugOwner`),
  Vue dev/prod, Svelte dev, babel-jsx attributes, Angular `ng-version`, empty
  body, and the sampling cap.
- `environmentDetection.ts`: `detectReact/Vue/Svelte/JSX` become thin wrappers
  over the probe (or are removed where `chooseAdapter` replaces them).
  `adapterSelection.getAdapter` uses `chooseAdapter`.
- `findFiberByHtmlElement.ts`: DOM key lookup on the element, then walk up
  parents (across shadow hosts) — the same thing react-dom's
  `getClosestInstanceFromNode` does. Drop the `hook.renderers` path.
- `clickSourceResolver.ts`: delete `getSourceFromDevTools` (dead). Keep
  `getFirstRendererInterface` — it opportunistically uses a real React DevTools
  hook when one is installed, which now works again because we never shadow it.
- `shared/types.ts`: remove `ReactDevtoolsHook`, `ReactInternals`, `Renderer`;
  keep `RendererInterface`. Delete `isValidRenderer.ts` and its test.

### Phase 2 — extension MAIN-world script without the hook

- Delete `packages/react-devtools-hook` and its references
  (`apps/extension/package.json`, `scripts/check-package-contract.js`).
- Rename `apps/extension/src/pages/Hook` → `pages/MainWorld` and
  `hook.bundle.js` → `main.bundle.js` (manifest v2 + v3, `webpack.config.js`,
  `utils/build.js` startup-bundle policy). The name stops describing something
  that no longer exists.
- Rewrite `insertRuntimeScript.ts` as `pageStatus.ts` (probe → status →
  publish, observer/debounce/re-check) and `injectClient.ts` (unchanged
  settings handshake, load/error → `client-failed`).
- Add a regression test that runs the MAIN-world entry and asserts
  `Object.prototype.hasOwnProperty.call(window, "__REACT_DEVTOOLS_GLOBAL_HOOK__")`
  is `false` — the exact check React DevTools makes.

### Phase 3 — protocol and popup

- `snapshotBridge.ts`: read and validate `locatorPageStatus`; include
  `pageStatus` in both the `ok: true` and `ok: false` responses; drop
  `hookDiagnostic`. Add `requestProbe` message relayed to the MAIN world.
- `syncedState.tsx`: replace `diagnostic: string` with
  `pageStatus: Accessor<PopupPageStatus>`; fold `ConnectivityStatus` into it.
- `packages/ui/src/PageStatusCard.tsx` with the copy table above; tests per
  state; a **Page status** section in `apps/ui-lab` rendering every state at
  popup width (450 px) for screenshots.
- `Popup.tsx`: `NoRuntimeView` → `PageStatusCard`; footer shows
  `Connected · <Framework> · <origin>`.

### Phase 4 — docs, e2e, verification

- `apps/extension/README.md` Requirements/Troubleshooting: remove babel
  jsx-source guidance that predates React 19; describe the states above.
  `apps/web/blocks/SetupLinks.tsx` and `pages/install/react.tsx`: drop "you
  might need React DevTools".
- `apps/playwright/tests/extensions/extension.spec.ts`: read
  `locatorPageStatus` instead of `locatorHookStatusMessage`.
- `pnpm check`, `pnpm -C apps/extension build` and `build:firefox`, then load
  the unpacked build next to React DevTools and confirm the Components panel
  populates on `test-apps/vite-react-clean-project`.

## Decisions taken

- **Never create `__REACT_DEVTOOLS_GLOBAL_HOOK__`.** Read it if someone else
  made it; that is the only way to coexist with React DevTools without
  vendoring its `installHook`.
- **jsx before react** in adapter priority, so explicit instrumentation wins
  and existing e2e behaviour is unchanged.
- **Keep the client gated** on a positive probe. Loading the runtime on every
  page would remove the gate's failure modes but costs 50 KB + a settings
  handshake on every site; the observer-based probe fixes the timing problem
  that made the gate annoying.
- **No framework versions in the footer.** React does not expose one without
  the hook; showing it for Vue only would be inconsistent.

## Out of scope

- Showing the same status inside the runtime overlay for npm users when no
  adapter matches. The probe makes that easy later.
- Firefox MV3 migration.
