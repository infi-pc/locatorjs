# CR1 — LocatorJS v2 → master

**Date:** 2026-08-23
**Scope:** `git diff origin/master...origin/v2`
**Base:** `origin/master` = `ac4ed50a8f3668a3390488ea7af483fb97a58009`
**Head:** `origin/v2` = `310e83493c1b46de526e1f72d47d2dbf81bced93`
**Commits / files / lines:** 54 · 508 · +37,473 / −13,444
**Local branch:** `infi-pc/caracas` (identical to `origin/v2`)
**Intent:** v2 release — settings/bindings/onboarding, four-layer config, iframe + shadow DOM, parents tree, `@locator/ui`, React 19 / Turbopack source resolution, CI/tooling.

**Verdict:** ⛔ **Not ready**

This is **review round 2**. PR #219 already landed as the 8 tip `fix:` commits (`1236a6d..310e834`). Those were not re-reported; they were checked for completeness. Several are incomplete at sibling sites.

## Coverage

16 reviewer tracks over the full range. The first attempt dispatched all 16 at once and was killed after only the unit-testing track returned; this resume re-ran the other 15 in waves of 5, each writing `.context/CR-full/findings-<lens>.md`. The orchestrator independently verified every P0/P1 and every clustered P2 against the code (counterexample, caller, existing test) before recording it here.

| #   | Lens                                  | Artifact                                                                  |
| --- | ------------------------------------- | ------------------------------------------------------------------------- |
| 1   | correctness · react-adapter           | `findings-correctness-react-adapter.md`                                   |
| 2   | correctness · runtime-core            | `findings-correctness-runtime-core.md`                                    |
| 3   | correctness + data-migration · config | `findings-correctness-config.md`                                          |
| 4   | correctness · extension               | `findings-correctness-extension.md`                                       |
| 5   | solid-reactivity (user-requested)     | `findings-solid-reactivity.md`                                            |
| 6   | frontend                              | `findings-frontend.md`                                                    |
| 7   | testing · unit                        | `02-findings-testing.md` (first attempt; orchestrator-verified on resume) |
| 8   | testing · e2e                         | `findings-testing-e2e.md`                                                 |
| 9   | maintainability                       | `findings-maintainability.md`                                             |
| 10  | project-standards                     | `findings-project-standards.md`                                           |
| 11  | security                              | `findings-security.md`                                                    |
| 12  | performance                           | `findings-performance.md`                                                 |
| 13  | api-contract                          | `findings-api-contract.md`                                                |
| 14  | reliability                           | `findings-reliability.md`                                                 |
| 15  | infrastructure                        | `findings-infrastructure.md`                                              |
| 16  | adversarial                           | `findings-adversarial.md`                                                 |

No lens came back empty of raw reviewer output. Several raw items were dropped (coverage gaps restated as live bugs, pre-existing `evalTemplate`, S3 eslint-disable noise, confidence &lt; 75). What remains is clustered by invariant.

---

## Findings

### 🔥 P0 — Critical

#### CR1-1 · Onboarding writes the editor onto the binding, never `editor`

|                |                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------- |
| **S/F → P**    | S1/F0 → P0                                                                                |
| **Gate**       | blocks                                                                                    |
| **Blast**      | all-users (every fresh extension install)                                                 |
| **Confidence** | 100                                                                                       |
| **File**       | `apps/extension/src/pages/Onboarding/Onboarding.tsx:202-214` (write), `:239-242` (picker) |
| **Reviewers**  | correctness-config, correctness-extension, api-contract, adversarial                      |

**Impact:** Every new install picks an editor as step 1. Alt+click then opens that editor; the tree, parents menu, outline label, and welcome “Test link” still open VS Code. The user is taught that LocatorJS is unreliable on first use.

**Invariant:** the global `editor` setting is where every source link opens unless an action deliberately overrides it (`docs/v2-bindings-migration.md:9-11`, `linkTemplateUrl.ts:10-14`). `hasEditorOverride` is `Boolean(action.targetId \|\| action.targetTemplate)` (`layeredOptions.ts:229-233`). `performAction` uses `resolveBindingTarget(action, …)` so the pin wins; `buildLink` / `resolveEditorTarget(effective.editor)` still see `DEFAULT_LAYER`'s `vscode`.

**Checked:** `WelcomeScreen.updateEditor` (`WelcomeScreen.tsx:85-93`) — the sibling `fc7dac7` fixed — writes `editor` and `clearPrimaryEditorOverride`. No `editor:` assignment exists under `apps/extension/src/pages/Onboarding/`. Default bindings have `{ kind: "open-editor" }` with no `targetId` (`layeredOptions.ts:74-78`); onboarding copies that list onto `user-extension` and sets `targetId`. Header “Setup guide” re-opens the same wizard.

**Proof (repro):** Fresh install → pick WebStorm → Done → Alt+click opens WebStorm; click a tree row or the outline label → VS Code. Stored `userOptions` has `bindings[0].action.targetId === "webstorm"` and no `editor` key.

**Red test:** After `selectEditor("webstorm")`, `userOptions.editor === { targetId: "webstorm" }` and `hasEditorOverride(primaryEditorBinding(bindings).action) === false`.

**Fix:** Match `WelcomeScreen.updateEditor`: write `{ editor: asEditorSelection(value) }` and `clearPrimaryEditorOverride` on the bindings. New actions already ship with no override.

---

#### CR1-2 · Breaking npm API shipped as 0.5.x; `@locator/ui` is not correctly publishable

|                |                                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **S/F → P**    | S1/F0 → P0                                                                                                                                                               |
| **Gate**       | blocks **npm publish** as 0.5.x; git merge is conditional on bumping in the same change                                                                                  |
| **Blast**      | all-users of `@locator/runtime` / `@locator/shared`                                                                                                                      |
| **Confidence** | 100                                                                                                                                                                      |
| **File**       | `lerna.json:1-4`; `packages/runtime/package.json:14,33-40`; `packages/shared/package.json:3`; `packages/ui/package.json:1-6`; `packages/styled-system/package.json:1-20` |
| **Reviewers**  | api-contract                                                                                                                                                             |

**Impact:** `@locator/shared` 0.5.0 and `@locator/runtime` 0.5.1 already exist on npm. This tree keeps those versions while removing `getStoredOptions` / `setStoredOptions` / `cleanOptions` / `listenOnOptionsChanges` / `ProjectOptions`, reshaping `setup()`, and making runtime depend on `@locator/ui` + `@locator/styled-system` as externals. `ui` is not `private`, has no `publishConfig.access` (scoped packages default to restricted), and `main`/`types` point at gitignored `dist/` with no `files` / `prepublishOnly`. `npm i @locator/runtime@0.5.1` after this publish either fails to resolve `@locator/ui` or breaks every `^0.5.0` consumer of the removed store API.

**Invariant:** a breaking change to a published export set or option shape is a major, and a published package’s `dependencies` must themselves be publicly installable with artifacts in the tarball.

**Checked:** `getStoredOptions` has no remaining export. `ui-lab` _is_ `private: true`. Extension webpack bundles ui (`release.js` turbo filter) so the Chrome zip is not this hole. `locatorjs` stub is unchanged (not worsened). `docs/v2-bindings-migration.md` calls the bindings change an intentional break; the version numbers do not.

**Proof:** `packages/runtime/package.json` is still `"version": "0.5.1"`. `pnpm -C packages/ui pack` without a prior build produces a tarball with no `dist/index.js`. A `^0.5.0` consumer of `import { getStoredOptions } from "@locator/shared"` fails after a patch publish.

**Fix:** Bump published packages that changed export set or option shape to **2.0.0**. Either mark `ui`/`styled-system` `private: true` and bundle them into runtime, or productize them (`publishConfig.access: public`, `files: ["dist"]`, `prepublishOnly`). Drop babel-jsx’s unused runtime dependency.

---

### 🔴 P1 — High

#### CR1-3 · Migration deletes v1 keys when `userOptions` is any truthy blob

|                |                                                                           |
| -------------- | ------------------------------------------------------------------------- |
| **S/F → P**    | S1/F2 → P1                                                                |
| **Gate**       | blocks                                                                    |
| **Blast**      | all-users (every 1.3.x → v2 upgrade)                                      |
| **Confidence** | 100                                                                       |
| **File**       | `apps/extension/src/pages/Content/migrateLegacyExtensionStorage.ts:64-75` |
| **Reviewers**  | correctness-config, correctness-extension, reliability, adversarial       |

**Impact:** `ba5af70` stopped the guaranteed first-load wipe, but the never-clobber branch still _deletes_ `target`/`controls`. Chrome does not re-inject content scripts on update. Opening the popup on an already-open tab and saving any All-sites field (or Reset All sites) writes `{}` or a partial blob; the later content-script run treats that as “already migrated” and throws the 1.3.x editor and modifiers away. User wakes up on VS Code + Alt.

**Invariant:** v1 `target` / `controls` are not removed unless their values have been successfully copied into `userOptions`.

**Checked:** Popup (`syncedState.tsx:56-63`) never calls the migrator. Background `onInstalled` only opens onboarding on `install`, not `update`. `done()` always `remove`s; `chrome.runtime.lastError` is never read, so a failed `set` still deletes. localStorage migration _does_ abort `removeItem` on `setItem` throw. Test at `migrateLegacyExtensionStorage.test.ts:97-107` pins skip-and-delete when `userOptions` already holds a full editor pick — not `{}` or a partial. Happy path (reload a page without opening the popup first) copies correctly.

**Proof (repro):** 1.3.x storage `{ target: "webstorm", controls: "ctrl+shift" }`, no `userOptions`. Install v2. Do not reload a page. Open popup (`no-runtime`), toggle any All-sites field. Reload a page. `target`/`controls` gone; Alt+click opens VS Code.

**Fix:** Run the migrator from the service worker (`onInstalled` install _and_ update) and from the popup before the first `userOptions` write. Copy missing v1 fields into an existing blob rather than skipping on any truthy value. `remove` only after a successful `set`. Do not treat `{}` as migrated.

**Cluster siblings:** same leftover class as CR1-7 (old content script after upgrade).

---

#### CR1-4 · `isChunkUrl` still lets `webpack-internal:///` through `accept()`

|                |                                                                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **S/F → P**    | S1/F1 → P1                                                                                                                                     |
| **Gate**       | blocks                                                                                                                                         |
| **Blast**      | all-users on Next webpack / CRA (the v2 headline “open the wrong file”)                                                                        |
| **Confidence** | 100                                                                                                                                            |
| **File**       | `packages/runtime/src/adapters/react/clickSourceResolver.ts:22-28`, `:970-972`; `packages/runtime/src/adapters/react/findDebugSource.ts:61-77` |
| **Reviewers**  | correctness-react-adapter, adversarial, reliability                                                                                            |

**Impact:** `8288387` made `resolveOriginalPosition` return null and funnelled async strategies through `accept()`, whose comment names `vscode://file/webpack-internal:///...` as the thing it must stop. `isChunkUrl` only matches `http(s):`, `/_next/`, `.next/dev/server/chunks/`. Strategy 4’s non-chunk branch `accept()`s the compiled URL and caches it. Sync `getSourceFromFiber` has no chunk guard, so `Runtime.tsx:258-277` short-circuits async and `window.open`s the compiled URL. Later strategies never run.

**Invariant:** a compiled URL is never accepted as a source, and a failed original-position lookup is never returned as one.

**Checked:** `stackFrame.test.ts:39-48` pins `fileName: "webpack-internal:///(app-pages-browser)/./app/page.js"`. `resolveOriginalPosition.test.ts:47-59` pins the _map_ lookup returning null — not `accept()`. `next16.spec.ts` webpack cases only assert the welcome dialog (see CR1-9); that describe is also not actually webpack.

**Proof (red test):** `isChunkUrl("webpack-internal:///(app-pages-browser)/./app/page.js") === true`. `getElementInfo` / `resolveSourceFromFiber` on a fiber whose `_debugStack` is that frame returns null or a real `app/page.tsx` — never `webpack-internal://…`.

**Fix:** Treat `webpack-internal:`, `webpack:`, `blob:`, and any path containing `/.next/` as compiled. Compiled names fall through to `resolveOriginalPosition` then `resolveViaNextDevServer`. Do not treat a sync compiled link as “found” in `Runtime.tsx` / `getElementInfoAsync`. Apply the same guard in `getSourceFromFiber`.

---

#### CR1-5 · A stale in-flight source-map fetch opens the previous component

|                |                                                               |
| -------------- | ------------------------------------------------------------- |
| **S/F → P**    | S1/F1 → P1                                                    |
| **Gate**       | blocks                                                        |
| **Blast**      | all-users on the React 19 / Turbopack path                    |
| **Confidence** | 100                                                           |
| **File**       | `packages/runtime/src/components/Runtime.tsx:239, 286-307`    |
| **Reviewers**  | adversarial (flagship), solid-reactivity F3 (Try/Esc sibling) |

**Impact:** `clickListener` is `async` with no click generation. Two capture-phase Alt+clicks run concurrently; each holds its own `target`/`elInfo` and both call `runAction` → `window.open`. If B’s fetch finishes first, the editor opens B; then A’s stale `await getElementInfoAsync` resolves and opens A. The user is looking at A’s file after clicking B. Opening the wrong source is worse than opening nothing.

**Invariant:** a click must not navigate after a later click (or Esc) has superseded it.

**Checked:** `1585967` snapshots `tryActionAtClick` and bails when Try mode changes (`:286-293`). For a normal Alt+click `tryAction` stays `null`, so that check is a no-op. Esc only `setTryAction(null)`. Sync `_debugSource` (Vite/babel-jsx) returns before async and cannot race this way. `sourceMapResolver` dedupes in-flight fetches _per URL_ (same map, not a mix-up). ActionSettings has a write generation; the click path does not.

**Proof (red test):** Mock `getElementInfoAsync` so call 1 (node A) resolves after 200ms and call 2 (node B) resolves immediately. Fire Alt+click A then B. `window.open` must be called once, with B’s path. Today it is called twice, last with A.

**Fix:** Stamp each click with a monotonic `generation` (and the clicked node). After every `await`, drop the result unless it is still the latest. Treat Esc / modifier-up / `tryAction` change as `generation++`.

---

#### CR1-6 · Closed-shadow tracking is installed a macrotask after first paint

|                |                                                                                       |
| -------------- | ------------------------------------------------------------------------------------- |
| **S/F → P**    | S1/F2 → P1                                                                            |
| **Gate**       | conditional (documented npm `setup()` then `render()`; also extension client)         |
| **Blast**      | all-users of closed shadow roots                                                      |
| **Confidence** | 100                                                                                   |
| **File**       | `packages/runtime/src/index.ts:8-10, 44`; `packages/runtime/src/initRuntime.ts:15-17` |
| **Reviewers**  | correctness-runtime-core, adversarial                                                 |

**Impact:** Closed roots cannot be rediscovered (`host.shadowRoot` is null). `installShadowRootTracking` runs only inside `initRuntime`, which both `setup()` and the extension entry schedule via `setTimeout(..., 0)`. Typical `setup(); createRoot().render(<App/>)` attaches every first-paint closed root in that gap. Alt+click then resolves to the host.

**Invariant:** a click inside a closed shadow root resolves to the inner node, not the host.

**Checked:** Tests pin install-then-attach only (`resolveEventTarget.test.ts:82-98`). Open roots attached in the gap _are_ recovered by `scan()`. UA shadows are out of reach either way. Docs already admit the before-load case; `setTimeout(0)` makes “before Locator loaded” include the entire first paint after `setup()` returned.

**Proof (red test):** `host.attachShadow({mode:"closed"})` + inner button; then `installShadowRootTracking()`; `getShadowRootOf(host)` is null and `resolveEventTarget` on the button returns `host`. Also assert `setup()` itself has patched `Element.prototype.attachShadow` before it returns.

**Fix:** Call `installShadowRootTracking()` synchronously from `setup()` and from the extension client/hook module body, _before_ the `setTimeout(initRuntime)`. Keep UI mount deferred.

---

#### CR1-7 · Existing tab after upgrade: old content script, new popup, no reload prompt

|                |                                                                                                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **S/F → P**    | S1/F1 → P1                                                                                                                                                        |
| **Gate**       | conditional (every Chrome auto-update until the user reloads)                                                                                                     |
| **Blast**      | all-users of the extension                                                                                                                                        |
| **Confidence** | 100                                                                                                                                                               |
| **File**       | `apps/extension/src/pages/Background/index.ts:3-7`; `apps/extension/src/pages/Content/snapshotBridge.ts:6-15`; `apps/extension/src/pages/Popup/Popup.tsx:110-114` |
| **Reviewers**  | api-contract, adversarial                                                                                                                                         |

**Impact:** Master CS handled `requestStatusMessage` / `requestEnable` and wrote `dataset.locatorTarget`. v2 popup sends `requestSnapshot` / `applySiteLocal` / `tryAction` and writes `userOptions`. No aliases. After update without tab reload: popup catch → “Page not connected — editing All sites.” Overlay still works (old runtime). Popup writes `userOptions`; old CS still watches `target`/`controls`. Editor change appears saved and does not apply. The next reload then hits CR1-3 if they saved anything.

**Invariant:** during an extension update, an old content script in a live tab must still understand the new popup, or the UI must tell the user to reload.

**Checked:** No `chrome.scripting` permission, no `executeScript` on `onInstalled`. New navigations _do_ get the v2 CS. `onInstalled` correctly does not re-open onboarding on update.

**Proof (repro):** Sideload 1.3.x, open a React tab, Alt+click works. Sideload v2 without reloading the tab. Popup: `no-runtime`. Alt+click still opens the v1 editor. Save a setting, then reload: CR1-3.

**Fix:** On `onInstalled` reason `update`, migrate storage in the worker, and either re-inject the content script or show “Reload this page to finish updating LocatorJS” when `requestSnapshot` fails after an upgrade.

---

#### CR1-8 · React 19 click has no fetch timeout and can sequentially download every Next chunk

|                |                                                                                                                                                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **S/F → P**    | S1/F2 → P1                                                                                                                                                                                                        |
| **Gate**       | blocks                                                                                                                                                                                                            |
| **Blast**      | all-users on Next 15+ / Turbopack / React 19                                                                                                                                                                      |
| **Confidence** | 100                                                                                                                                                                                                               |
| **File**       | `packages/runtime/src/adapters/react/sourceMapResolver.ts:322, 315-340`; `packages/runtime/src/adapters/react/clickSourceResolver.ts:98, 162-186, 781-817`; `packages/runtime/src/components/Runtime.tsx:280-288` |
| **Reviewers**  | reliability, performance                                                                                                                                                                                          |

**Impact:** There is no `AbortController` anywhere in `packages/` (grep empty). `loadSourceMap` stores the in-flight Promise in `loadingPromises` until `finally`, so a hung TCP connection makes _every later_ lookup for that URL wait on the same Promise. `clickListener` `preventDefault`s _before_ the await, shows no spinner, and a normal Alt+click cannot be cancelled (CR1-5). Strategy 7/8 then `getAllChunkCodes`: N sequential whole-bundle downloads (typical Next N=20–80), `MAX_CACHED_CHUNKS = 24` so N&gt;24 evicts and the owner-chain walk refetches. A stall eats the click forever; a miss scans the world.

**Invariant:** a source-map / chunk / Next-dev-server lookup either settles within a bound or is abandoned; resolving one click does not download assets unrelated to that click.

**Checked:** 404 fails fast and is cached as `null` for 5s — that path is fine. `snapshotBridge.ts:169` _does_ time out page replies at 1s; the resolver was not given the same treatment. Sync `_debugSource` (Vite + babel-jsx) never enters this path.

**Proof:** `page.route('**/*.map', route => {})` (never fulfill) on `test-apps/next-16-turbopack`, Alt-click. Expected: within N seconds, `NoLinkDialog` or the page click proceeds. Actual: click eaten, subsequent Alt-clicks on that chunk also hang.

**Fix:** `AbortController` with a ~2–5s timeout on every resolver `fetch`; time out → `null` and fall through (do not store a hung Promise). Resolve from the stack-frame URL only; `Promise.all` leftovers; don’t scan Tailwind utility tokens. Show a pending state, or don’t `preventDefault` until resolution is started with a timeout. Wrap `clickListener` in `try/catch` and open `NoLinkDialog` on abort.

---

#### CR1-9 · The `next` e2e group never runs webpack and treats “Welcome to Locator” as proof of app-source resolution

|                |                                                                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **S/F → P**    | S2/F0 → P1                                                                                                                                                                     |
| **Gate**       | conditional (the only e2e net under `8288387` / CR1-4 cannot fail the failure mode that commit names)                                                                          |
| **Blast**      | the `next` required CI check; every Next-on-webpack user of the loader                                                                                                         |
| **Confidence** | 100                                                                                                                                                                            |
| **File**       | `apps/playwright/tests/libs/next16.spec.ts:46-66, 113-121`; `test-apps/next-16/package.json:6`; `test-apps/next-16/next.config.ts:3-19`; `apps/playwright/tests/apps.ts:30-56` |
| **Reviewers**  | testing-e2e, testing-unit                                                                                                                                                      |

**Impact:** Next 16.0.0 made Turbopack the default for `next dev`. Both next-16 and next-16-turbopack omit `--webpack`. next-16’s loader is registered only under `turbopack.rules`; there is no `webpack()` hook. next-14 is the only fixture with a real `webpack()` + `@locator/webpack-loader` rule, and `apps.ts` omits it. The webpack describe and the server-heading case never call `expectFileInAppSource`. Turbopack cases that do match `/test-apps\/next-16-turbopack\/app\//` only — never a line, never two instances. `Runtime.tsx:265-277` opens Welcome whenever `elInfo.thisElement.link` is set, including `react-jsx-dev-runtime.development.js` and `webpack-internal:///…`.

**Invariant:** a job/describe named for webpack Next actually runs webpack, and a Next/React 19 click that opens onboarding did so on a user file:line.

**Checked:** `e2e-groups.ts:65-68` boots only `next16` and `next16Turbopack`. `PORT_NEXT_14` is in `dev-ports.sh` and `turbo.json` but Playwright never starts the package. No `.only`/`.skip` in the diff.

**Proof:** next-16 `dev` is `next dev -p …` with no `--webpack`. `expectFileInAppSource` is referenced from six turbopack tests and zero webpack/server-heading tests.

**Fix:** `next-16` → `next dev --webpack` _and_ a `webpack()` loader rule, or rename the describe and add next-14 to `apps.ts` + the `next` group. Stub `window.open`. Assert `test-apps/<app>/app/<file>:<line>`. Fail on `node_modules`, `webpack-internal`, `react-jsx-dev-runtime`. Click two `<Card/>`s and require distinct lines.

---

#### CR1-10 · Injected runtime statically pulls `@locator/ui` + Ark + Lucide + 115 kB of Panda CSS

|                |                                                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| **S/F → P**    | S2/F0 → P1                                                                                                       |
| **Gate**       | conditional                                                                                                      |
| **Blast**      | every LocatorJS user (the developer’s app main thread at startup); `all_frames: true` multiplies by iframe count |
| **Confidence** | 100                                                                                                              |
| **File**       | `packages/runtime/src/components/Runtime.tsx:16, 21, 30`; `packages/runtime/src/components/Options.tsx:10-17`    |
| **Reviewers**  | performance                                                                                                      |

**Impact:** Master deps were `solid-js`, `@locator/shared`, `@floating-ui/dom`. v2 adds `@locator/ui`, `@locator/styled-system`, `@ark-ui/solid`, `lucide-solid`. `Runtime` statically imports `Options` / `WelcomeScreen` / `TreeView`; `Options` statically imports `ActionSettings` from `@locator/ui` (Ark Select). Generated CSS string is 115_058 bytes vs master’s 35_049. Paid on every page load, before settings or the tree are opened.

**Invariant:** the injected bundle does not parse settings/tree/onboarding UI until that UI is opened.

**Checked:** `initRuntime` dynamically imports only `Runtime`; everything Runtime statically imports is in the first chunk. Same-package `import { Options }` cannot be tree-shaken away. Extension zip is the same graph.

**Fix:** `import()` Options / WelcomeScreen / TreeView / ContextView on first open. Move `actionLabel` out of the UI barrel.

---

### 🟠 P2 — Moderate

#### CR1-11 · `58dae99` write-contract leftover sites

**S2/F2 → P2** · gate: conditional · blast: all-users · confidence 100
**Invariant:** a settings write that returns `{ok:false}` is reported, not treated as success; every read-modify-write of `userOptions` is serialised.

Sites still fire-and-forget or sit off the queue:

- `Onboarding.tsx:232-253` — wizard advances on a failed editor/shortcut write (`selectEditor` / `saveCustomTemplate` ignore `.ok`; `updateModifiers` is not even awaited).
- `syncedState.tsx:195-202` vs `:130-149` — `clearUserExtension` (and the mouseModifiers persist at `:60-62`) sit off `queueUserExtensionWrite`. Reset All sites can be overwritten by the write it cancelled.
- `Options.tsx:233-236` — Disable then `onClose()` with no await. Popup twins were fixed.
- `WelcomeScreen.tsx:67-78`, `DisableConfirmation.tsx:40`, `IntroInfo.tsx:104`, `optionsStore.tsx:144` (`enableLocator` always returns `"Locator enabled"`).

**Checked:** Popup Enable/Disable/Reset and `ActionSettings.write` _do_ branch on `WriteResult`. `syncedState.test.tsx` asserts clear in isolation, never overlapping a queued set.

**Fix:** Await and branch at every leftover; run clear and the mouseModifiers persist through `pendingWrite`.

---

#### CR1-12 · `componentSourceCache` negative-caches a miss for the fiber’s life

**S2/F1 → P2** · gate: conditional · blast: all-users · confidence 100
**File:** `clickSourceResolver.ts:149, 876-882, 1084-1086, 1095-1101`

`8288387` keyed the cache on the fiber (the `fiber.type` bug is fixed) and put map/chunk caches on a 5s TTL. The result WeakMap still stores `null` on total failure and `readCachedSource` honours it via `!== undefined`, including via `fiber.alternate` across Fast Refresh. Project-root inference was changed to “successes only” for this exact poison; the fiber cache still negative-caches. Combined with CR1-8, a timed-out first click is remembered as “no source”.

**Recalibration:** not S1 — the two-`<Row/>`s bug is gone; this is sticky-miss / stale-line after HMR, not per-type aliasing.

**Fix:** Do not store `null`. TTL successes with the maps, or drop the result cache. Do not read `alternate` for a negative.

---

#### CR1-13 · Component-name JSX scan is dead (`hasJsxCallBefore` exclusive slice)

**S2/F2 → P2** · gate: non_blocking · blast: all-users · confidence 100
**File:** `clickSourceResolver.ts:272, 348-351`

`extractSourceFromTurbopackChunks` passes `afterName` (index of the comma) into `hasJsxCallBefore`, whose slice is exclusive and whose regex demands the comma plus `$`. Native-element scan passes `attrIndex` (after the comma) and works. Last-resort strategy only.

**Fix:** Pass `afterName + 1`, or drop the comma from the regex and keep the `startsWith(",", afterName)` guard. Export and pin both.

---

#### CR1-14 · Tree `getChildren` does not invert the new shadow-aware `getParent`

**S2/F2 → P2** · gate: conditional · blast: all-users · confidence 100
**File:** `packages/runtime/src/adapters/HtmlElementTreeNode.ts:25-42`

v2 taught `getParent` to step out through the shadow host (`domTraversal.ts:12-22`) but left `getChildren` as `element.children`. Opening the tree from a shadow-internal node selects an id that is not in `rows`.

**Fix:** `getChildren` should also yield `getShadowRootOf(this.element)`’s element children (not slotted nodes twice).

---

#### CR1-15 · TreePanel `<For>` tears down every row on expand; keyboard focus is on descendant buttons

**S2/F2 → P2** (identity) and **S2/F1 → P2** (tab order) · gate: conditional · blast: all-users · confidence 100
**File:** `packages/ui/src/TreePanel.tsx:297, 270-276, 369-376`; `packages/ui/src/treeModel.ts:59-69`

`visibleTreeRows` allocates a new `{row, depth}` every call; `<For>` keys by reference, so expand destroys every `Row` and the chevron (a real `<button>`) dumps focus to `<body>`. Independently, `onKeyDown` lives only on `role="tree"`; Tab lands on “Show parent” / chevron and arrows do nothing. `1585967` switched BindingsEditor to `<Index>` for this class; TreePanel was not updated.

**Fix:** `<For>` over stable `row.id`; `tabIndex={-1}` on twisty and Show parent (or roving tabindex on `treeitem`s).

---

#### CR1-16 · All-frames injection dumps All-sites settings into every origin

**S1/F3 → P2** · gate: conditional · blast: all-users · confidence 100
**File:** `apps/extension/src/manifest.v3.json:19-20`; `apps/extension/src/pages/Content/index.ts:39-42`

Master injected the top frame and wrote only `locatorTarget` / `locatorMouseModifiers`. v2 is `all_frames: true` and `dataset.locatorUserExtensionOptions = JSON.stringify(options)` of the full All-sites blob (`projectPath`, templates, `replacePath`, `tmuxSession`). A third-party iframe can `JSON.parse` it with no click.

**Recalibration:** S1 information disclosure, not RCE; F3 (malicious iframe that knows to scrape this dataset). Not P0.

**Fix:** Don’t publish the raw blob. If the runtime needs a subset in-frame, send only `editor.targetId`, binding kinds/modifiers, and flags.

---

#### CR1-17 · Popup can persist a page-supplied snapshot into All-sites storage

**S1/F3 → P2** · gate: conditional · blast: all-users · confidence 100
**File:** `snapshotBridge.ts:118-130`; `ActionSettings.tsx:193, 286-291`; `Home.tsx:78-91`

`310e834` rebuilt write results and refused malformed replies; `validateSnapshot` is still a shallow wrap of nested `layers`/`allTargets`. `confirmDraft` writes `insertBinding(bindings(), draft)` where `bindings()` is _resolved effective_. Editing All-sites with empty `user-extension.bindings` copies `team` (from the page snapshot) into `chrome.storage.local`. Combined with a well-shaped forged snapshot, a hostile page can plant a `targetTemplate`.

**Trigger:** connected to a hostile page _and_ add/edit an All-sites binding — not every popup save. `Home` already special-cases `user-extension` from real storage.

**Fix:** Deep-validate / field-by-field rebuild; persist only the active layer’s own fields; scheme-check templates on write.

---

#### CR1-18 · Hover / parents / tree never see React 19 sources

**S2/F1 → P2** · gate: conditional · blast: all-users · confidence 75
**File:** `packages/runtime/src/components/MaybeOutline.tsx:38-75`; `packages/runtime/src/adapters/react/findDebugSource.ts:21, 101-104`; `reactAdapter.ts:127-152`

`getParentsPaths` / `ReactTreeNodeElement.getSource` / hover outline use only sync `findOwnDebugSource`, which does not parse `_debugStack`. On Next 15+ / Turbopack the outline paints “No source found” even when Alt+click would resolve via `getElementInfoAsync`. `buildParentRows` drops unsourced items (`if (!link) return`). Click-to-editor still works (async). `tree-parents.spec.ts` runs only against babel-jsx react.

**Fix:** Parse `_debugStack` in `getSourceFromFiber` when the frame is already original; for compiled frames leave for async. Warm the outline from `getElementInfoAsync`. Give parents/tree an async path. Do not paint “No source found” while async resolve is in flight.

---

#### CR1-19 · Fresh extension install: silent `vscode://` success; popup dropped the hook-status string

**S2/F1 → P2** · gate: conditional · blast: all-users · confidence 100
**File:** `Runtime.tsx:266-277`; `performAction.ts:45-55`; `Popup.tsx:110-113`; `insertRuntimeScript.ts:13-16`

Extension React skips the in-page wizard (`!isExtension() \|\| detectSvelte()`). Default `editor` is `vscode`, so `needsEditorSetup` is false. `window.open("vscode://…")` with no handler is a silent OS no-op; `performAction` returns `true`. v1 popup showed `dataset.locatorHookStatusMessage` (production build, no React, DevTools collision); v2 only says “Page not connected”. npm `setup()` first click still opens `WelcomeScreen`.

**Fix:** If `editor` is still the default and onboarding never wrote it, open `setup-editor`. Restore hook status in `NoRuntimeView`.

---

#### CR1-20 · `pnpm release` / `release:chrome` still zip whatever `dist/` is on disk

**S2/F1 → P2** · gate: conditional (store zip cut with `release:node` is fine) · blast: ops-only · confidence 100
**File:** `apps/extension/package.json:23-25`; `apps/extension/README.md:104-122`

`310e834` made `release.js` run `turbo --filter=locatorjs-extension^...`. `pnpm release` / `release:chrome` still `run-s build pack:*` (webpack only). README step-by-step still `shared → runtime → extension` and omits `@locator/ui` / `styled-system`.

**Fix:** Point `release` / `release:chrome` / `release:firefox` at `release.js`. Update README. Extension store version is still `1.3.3` for a v2 protocol rewrite (pair with CR1-2).

---

#### CR1-21 · Draft inspector Shift+Tab leaves the modal; ProvenanceBadge tooltip escapes the shadow; Field labels are not associated

**S2/F1 → P2** · gate: non_blocking · blast: all-users · confidence 100
**Files:** `InspectorDialog.tsx:134-139` + `ActionInspector.tsx:83-86`; `ProvenanceBadge.tsx:40` + `Tooltip.tsx:88`; `Field.tsx:39`

Draft heading `tabIndex={-1}` is focused after the dialog’s `content.focus()`; the trap’s `focusableSelector` excludes it, so Shift+Tab walks into the host page. ProvenanceBadge never receives `portalMount`; Tooltip defaults to `document.body` (unstyled host-page text). Field `<label>` wraps only the caption — Advanced “Project path” / “Tmux session” are nameless. Ark Select _does_ pass `portalMount` after `8920a4e`.

**Fix:** Don’t focus the draft heading (or treat any focused descendant as first for wrap). Plumb `portalMount` into ProvenanceBadge / a PortalMount context. `for` + control id on Field.

---

### 🔵 P3 — Low

#### CR1-22 · `firstFrameInStack` survived the stack-parser unification

**S2/F3 → P3** · `clickSourceResolver.ts:714-723` vs `stackFrame.ts:144-155`. `8288387` said one picker; the async path still has a private loop that omits `isLocatorFrame`. Drift trap more than a click-the-toolbar bug (`isLocatorsOwnElement` already stops overlay clicks). Delete `firstFrameInStack`; call `firstUserFrame`.

#### CR1-23 · `USER_OPTIONS_KEY` redeclared in the popup

**S2/F3 → P3** · `syncedState.tsx:21` vs the export `migrateLegacyExtensionStorage.ts:4` that `ba5af70` extracted so the two sides cannot disagree. Import the constant.

#### CR1-24 · New `@ts-ignore` on `window.enableLocator`; AGENTS.md counts are stale

**S2/F1 → P2-ish, recorded as P3 for the binary** · `optionsStore.tsx:141-146` re-added `@ts-ignore` with a `ban-ts-comment` disable and no `--` reason, while the same range converted `shared` / the devtools hook to `@ts-expect-error` with descriptions. `pnpm turbo run lint ts test --dry=json`: `@locator/dev-config` has no `lint`/`ts` scripts; AGENTS.md still says “all 13 packages”. `--no-webstorage` is only in runtime’s vitest config, not shared. 44 new `eslint-disable`s, 2 with a `--` reason.

**Fix:** `@ts-expect-error assigning enableLocator on window`. Give `dev-config` scripts or stop saying “all 13”. Copy the `--no-webstorage` probe into shared. Update file counts.

#### CR1-25 · `pnpm dev` exports `PORT=3342` into the extension webpack-dev-server

**S2/F3 → P3** · `apps/extension/utils/env.js:4`; `scripts/dev-ports.sh` always exports `PORT=3342` (`apps/web`). Before this range the extension defaulted to 3300. Give the extension `PORT_EXTENSION`.

---

## 🛡️ Latent hazards — guarded upstream, no priority

- **L1 · `resolve()` copies `Object.keys`, including `"__proto__"`.** Guard: team/user-origin can already set `editor` directly, so no extra capability today. **S-if-unguarded:** S1 (inherited `editor` on `effective`). **Unguarded by:** a merge of untrusted JSON with `__proto__`. **Local enforcement:** copy only `keyof LocatorOptions` onto `Object.create(null)`.
- **L2 · Firefox `browser.storage` callback vs promise.** Guard: none; `browser.ts` selects the promise `browser` global. **S-if-unguarded:** S1 (content script never injects `userOptions` because `migrateLegacyExtensionStorage` waits on a callback the promise API may ignore). **Unguarded by:** Firefox build (`build:firefox`). **Local enforcement:** Promise API only (the popup already does).
- **L3 · No schema `version` on stored blobs.** Guard: none. **S-if-unguarded:** S1 on the next shape change (this pass guessed by key presence, which is how CR1-3 treats `{}` as migrated). **Unguarded by:** a v3 rename. **Local enforcement:** write `version: 2` on every `writeStored` / `userOptions` set.
- **L4 · Runtime `popupBridge` still `postMessage(..., "*")`.** Guard: same-window delivery; the page already has `window.__LOCATOR_RUNTIME__`. **S-if-unguarded:** S3. **Unguarded by:** posting these payloads to `parent` / frames. **Local enforcement:** `window.location.origin`, matching `snapshotBridge.ts`. (`310e834` claimed both broadcasts use this origin.)
- **L5 · `resolveSourceFromStack` still echoes the compiled frame.** Guard: no production caller. **S-if-unguarded:** S1 (CR1-4). **Unguarded by:** a new strategy calling it. **Local enforcement:** `return resolveOriginalPosition(...)` with no `?? compiled`.
- **L6 · `AdvancedSettings` inner write props still typed `void | Promise<boolean>`.** Guard: helpers not exported; outer write already maps `WriteResult`. **S-if-unguarded:** S1 (`58dae99`’s `!== false` object-as-success). **Unguarded by:** extracting `TextSetting` as public `@locator/ui`. **Local enforcement:** type those props `WriteResponse` now.
- **L7 · `findDebugSourceAsync` falls through to `_debugOwner` / `fiber.return`.** Guard: only when the clicked fiber returned null. **S-if-unguarded:** S1 (opens the parent’s file — another wrong-file). **Unguarded by:** any child miss while an ancestor resolves. **Local enforcement:** do not return an ancestor source from the clicked-element path.
- **L8 · Select/Tooltip default `document.body`.** Guard: every production Select caller passes `portalMount`. **S-if-unguarded:** S2 (CR1-21). **Unguarded by:** a new `Select` without the prop. **Local enforcement:** a `PortalMount` context next to `EnvironmentProvider`.
- **L9 · `eslint-plugin-solid` is `warn`, not `error`.** Guard: plugin is configured (`eslint-solid-preset.js`) for `ui`, `runtime`, `extension`, `ui-lab`. **S-if-unguarded:** the `1585967` class ships as warnings. Not a missing plugin.

---

## 🧪 Testing gaps

Not live bugs. They are why CR1-3, CR1-4, CR1-5, CR1-12 landed unpinned, and why the 8 tip `fix:` commits can regress silently.

Headline cluster: **a prior-round fix landed without a testing seam.** `shadowRoots.ts:87` and `teamLayerStore.ts:34` already precedent `__reset*ForTesting`. Two of the 8 fixes are written so they cannot be unit-tested (module-private WeakMap, module-level `turbopackProjectRoot` with no reset).

| Gap                                                                       | Where                                   | What is unpinned                                                                                                                                                                            |
| ------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `findDebugSource.ts` (+193) has no test file                              | `packages/runtime/src/adapters/react/`  | 8-strategy ladder, `findOwnDebugSource` vs owner walk, cyclic `return` `visited` set. Pure functions over fiber literals.                                                                   |
| Fiber result cache / `isChunkUrl` / `hasJsxCallBefore`                    | `clickSourceResolver.ts`                | CR1-4, CR1-12, CR1-13. No export, no reset.                                                                                                                                                 |
| `rootFromSource` / `bestRoot` / `resolveProjectPrefix`                    | `clickSourceResolver.ts:54-119`         | Separator-boundary match, node_modules preference, success-only cache. `8288387` said “the pure parts had no tests at all; they now do” — these three didn’t.                               |
| `parseInspectElementSource`                                               | `clickSourceResolver.ts:404`            | Both DevTools payload shapes.                                                                                                                                                               |
| Indexed source maps                                                       | `sourceMapResolver.ts:240`              | `createIndexedSourceMapConsumer`; fixtures are flat.                                                                                                                                        |
| `listenOnUserOriginChanges` unsubscribe                                   | `sharedOptionsStore.ts:159`             | The entire `310e834` leak fix. No-storage branch returning a callable noop is load-bearing for `onCleanup`. (Orchestrator-verified: code is correct today; `getOwner()` is a second guard.) |
| `setUserOriginOptions` preserves `uiState`                                | `sharedOptionsStore.ts:126`             | Reverse direction (`clear` / `setUiState`) is tested; write-preserves-read is not.                                                                                                          |
| Snapshot-identity guard                                                   | `syncedState.tsx:105`                   | `Popup.test.tsx` mocks `./syncedState` entirely; `syncedState.test.tsx` advances 1500ms only in the reject case.                                                                            |
| `queueUserExtensionWrite` never contended                                 | `syncedState.tsx:130-148`               | Tests await each write in turn.                                                                                                                                                             |
| `layerFieldState`                                                         | `packages/ui/src/layerFieldState.ts:27` | `setHere` vs inherited; AdvancedSettings test only covers a field set on the edited layer.                                                                                                  |
| TreePanel / ActionInspector / InteractionStudio / InspectorDialog         | `packages/ui`                           | 1,186 lines of new interactive UI with zero unit tests. Tree is slow-covered by the `tree` e2e group (babel-jsx only).                                                                      |
| Select.test restates pre-click icon count; Wizard is one forward-nav test | `packages/ui`                           | Open-menu icon unverified.                                                                                                                                                                  |
| `embedding.spec.ts` “late-added iframe”                                   | `:272-294`                              | Poll is `toBeGreaterThan(1)` on a page that already has ≥3 `iframe-child.html` frames; last-match is not the late iframe.                                                                   |
| `embedding.spec.ts` “child overlay stays inside the child”                | `:245-256`                              | Never asserts a child overlay, only parent `false`.                                                                                                                                         |
| Completeness checks vs Playwright glob                                    | `e2e-groups.ts:116-122`                 | `*.spec.ts` only; `projects.foo` only; `ci: false` + delete from matrix is how `extension` is excluded and would silently drop `adapters`. Holds today.                                     |
| Extension popup                                                           | `e2e-groups.ts:75-79`                   | `ci: false` by design. No lib group boots the popup, so CR1-1 / CR1-3 / CR1-7 have no e2e net.                                                                                              |

`migrateLegacyStorage.test.ts` and `layeredOptions.test.ts` are genuinely thorough (idempotency, corrupt JSON, 16 layer permutations, `false`-vs-`undefined`, atomic fields). Do not re-derive that.

No `.only` / `.skip` / `xit` in the diff.

---

## ⚠️ Residual risks

- **Wrong file is this product’s flagship failure.** CR1-4, CR1-5, CR1-8, L7 are four independent ways a click opens the wrong source or a compiled URL. They share no single patch.
- **Upgrade is a gauntlet.** CR1-3 (save before migrate) + CR1-7 (old CS) + CR1-1 (new installs) + deleting v1 keys so rollback sees empty storage (`migrateLegacyStorage.ts:92-96`). Happy-path “reload a page, never open the popup first” works.
- **e2e will not catch CR1-4.** The `next` group’s “webpack” app is Turbopack (CR1-9).
- **`pnpm e2e` on default ports reuses another workspace’s servers** — AGENTS.md already warns; `reuseExistingServer` is off on CI.
- **Solid `solid/reactivity` is warn**, so the `1585967` class can ship again as a warning. TreePanel (CR1-15) is the leftover of that class.
- **Editor URL construction** (`evalTemplate` / `transformPath` on the finished URL, no scheme allowlist) is pre-existing; v2 widens it via per-binding `targetTemplate` and team `editor`. Not re-filed as a new parser bug; CR1-17 is the persist path that would make a hostile template durable.
- **Cross-frame modifier snapshots are unsequenced** (`crossFrameModifiers.ts:112`) — stuck overlay after a delayed Alt-down, not a wrong navigation (`matchBinding` reads the real event). Not promoted.
- **Unvirtualised TreePanel** on a 500-row list (performance F5) — hitch, not wrong file. Not promoted.

---

## Assumptions

- Merging `origin/v2` to `origin/master` is the proposed v2 release, including npm publish via `lerna.json` `"version": "0.5.1"`. If this branch will not be published as 0.5.x, CR1-2’s merge gate relaxes to “bump before the first publish”, not “block the git merge”.
- Chrome Web Store zip is cut with `release:node` in the happy path; CR1-20 is the sibling scripts.
- Frequency for CR1-1 is F0 because _every_ use of onboarding (the first step of every fresh install) hits the split-brain. Frequency for CR1-3 is F2 because the user must save in the popup before a v2 content script has run.

## Unreviewed areas

None of the 16 dispatched lenses failed to report. `pnpm-lock.yaml` churn was not line-audited (by design: new deps were checked via `package.json`). `packages/styled-system/dist` and `apps/extension/build` were excluded as generated. `apps/web` marketing copy was not design-reviewed. `tests/extensions` is `ci: false` and was not executed.

## No findings (after synthesis)

No entire lens was empty. After orchestrator judgement, these _classes_ had no surviving live finding of their own: four-layer `resolve()` precedence (single implementation, well-tested); `b2db093` shortcut/right-click; `7d28a4b` canonical path reading; plugin ↔ runtime attributes; SHA-pinned CI actions; `pnpm check` ≡ CI `check` job; turbo `globalEnv` covering every `dev-ports.sh` export; Vite `--strictPort`; Node pinned via `.nvmrc`; `eslint-plugin-solid` _is_ configured for every Solid package.

---

## Suggested fix order

1. **CR1-1** onboarding writes `editor` (P0, one function).
2. **CR1-2** version bump / `private` on ui (P0, packaging).
3. **CR1-3 + CR1-7** migrate in the worker + popup, reload prompt (P1, one upgrade story).
4. **CR1-4** `isChunkUrl` + sync guard (P1, one predicate).
5. **CR1-5** click generation (P1, the flagship).
6. **CR1-8** fetch timeout (P1, unblocks CR1-12’s sticky miss).
7. **CR1-6** patch `attachShadow` in `setup()` (P1).
8. **CR1-9** make the `next` group honest, so 4/5 cannot regress.

Do not land another `fix:` round without a seam for the cache / root-inference / `isChunkUrl` predicates. `shadowRoots.ts:87` is the precedent.

---

## Resolution record

All production fixes below landed in `7f43449` (`fix: remediate CR1 root causes`). This report update records the post-fix verification evidence.

| Finding | Resolution in `7f43449`                                                                                                                                                     | Verification evidence                                                                   |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| CR1-1   | Onboarding atomically writes top-level `editor` and clears the primary binding override; failed writes retain the current step.                                             | Extension onboarding/popup unit tests; `pnpm check`.                                    |
| CR1-2   | Fixed-mode public packages and the extension are 2.0.0; UI/styled-system now pack built entries, declarations, and licenses.                                                | `pnpm package-contract`; temporary consumer imported packed `@locator/runtime`.         |
| CR1-3   | A versioned storage envelope decodes legacy, partial, and unversioned states, merges v1 fields independently, serializes writes, and preserves v1 mirrors.                  | Storage migration/write ordering/failure tests; `pnpm check`.                           |
| CR1-4   | One compiled-location predicate now rejects webpack, blob, `_next`, and `.next` sources at resolver boundaries.                                                             | Stack/resolver unit tests and exact Next webpack URL assertions.                        |
| CR1-5   | Runtime owns an abortable, identity-checked resolution operation; superseded clicks and Escape cannot act.                                                                  | Resolver operation/cancellation tests; full E2E.                                        |
| CR1-6   | Shadow-root interception is installed synchronously by `setup()` and extension evaluation, with idempotent runtime defense.                                                 | Shadow traversal unit tests and embedding E2E across three browsers.                    |
| CR1-7   | Popup/content handshake uses protocol v2, probes legacy clients, preserves diagnostics, and offers user-triggered reload.                                                   | Popup protocol/reload/diagnostic unit tests.                                            |
| CR1-8   | Resolution has a four-second operation deadline, bounded fetch controllers, candidate-only concurrent chunk loading, and cancellation-isolated shared fetches.              | Resolver timeout, candidate, concurrency, and retry tests; Next E2E.                    |
| CR1-9   | Next 16 now runs `next dev --webpack` with the webpack loader; tests intercept editor navigation and assert exact `page.tsx` lines 8 and 30 while rejecting compiled paths. | `E2E_GROUP=next`: 27/27 across Chromium, Firefox, and WebKit.                           |
| CR1-10  | Runtime startup is a small shell; UI and feature CSS load in the deterministic `locator-runtime-ui` chunk, and the build enforces the startup graph/size cap.               | Chrome/Firefox release builds; startup shell about 18 KiB.                              |
| CR1-11  | Settings writers consistently return/await `WriteResult`; pending and error states prevent false success and premature closing.                                             | UI and extension write-failure tests; typecheck.                                        |
| CR1-12  | Fiber source caching is positive-only with five-second expiry and a reset seam; misses, aborts, and failures remain retryable.                                              | Cache expiry and failure-retry unit tests.                                              |
| CR1-13  | JSX component scanning is a pure single-chunk function with corrected delimiter indexing.                                                                                   | Scanner boundary/false-positive unit tests.                                             |
| CR1-14  | Child traversal now covers light DOM plus tracked open/closed shadow-root children without double-counting slots.                                                           | DOM traversal unit tests and embedding E2E.                                             |
| CR1-15  | Tree rows reconcile by primitive id; the tree is the composite tab stop with `aria-activedescendant`, stable item ids, and focus-preserving twisties.                       | Tree/UI unit tests and tree E2E: 42/42.                                                 |
| CR1-16  | Only top/same-origin frames receive full options; cross-origin frames receive a decoded, non-sensitive action/trigger projection.                                           | Snapshot/projection security unit tests and embedding E2E.                              |
| CR1-17  | All-sites writes derive only from defaults, storage-backed extension state, and explicit input; page layers remain display-only.                                            | Popup layer/write tests and field-by-field snapshot decoding tests.                     |
| CR1-18  | React source lookup is asynchronous for hover/action context, parents, and visible expanded tree rows, with pending UI and positive result retention across rebuilt nodes.  | Resolver tests; tree E2E; Next React 19 E2E.                                            |
| CR1-19  | Default-provenance editors are unconfigured across click/tree/parents/welcome flows, and v2 failures preserve hook diagnostics.                                             | Popup/runtime tests and explicit-default tree E2E.                                      |
| CR1-20  | Every release alias routes through one dependency-aware Node/Turbo pipeline before packaging either browser.                                                                | `pnpm --dir` equivalent `apps/extension pnpm run release`; both ZIP artifacts produced. |
| CR1-21  | Dialog focus/trapping was repaired, runtime-scoped portal context is used by dialogs/selects/tooltips, and fields have explicit label/control associations.                 | UI tests, typecheck, and tree/settings E2E.                                             |
| CR1-22  | The private stack picker and compiled-frame fallback were removed in favor of the canonical user-frame parser.                                                              | Stack/source-map unit tests.                                                            |
| CR1-23  | Extension storage keys, codecs, readiness, migration, and write queue live in one storage-contract module.                                                                  | Extension unit tests and Knip.                                                          |
| CR1-24  | `Window.enableLocator` and the cross-browser extension global are typed; suppressions require descriptions; stale test counts were removed.                                 | ESLint suppression checker, lint, and typecheck.                                        |
| CR1-25  | `PORT_EXTENSION` is a dedicated workspace offset with a 3300 unsourced fallback and Turbo cache-key coverage.                                                               | Config inspection; `pnpm check`; isolated E2E port block.                               |

Related latent hazards L1, L3, L5, L6, L8, and L9 are covered in `7f43449` by the allowlisted decoders/resolver, storage envelope, no-compiled fallback, unified writer type, portal context, and error-level Solid reactivity rule. L4's origin-targeted runtime bridge is completed in `61225de`. L7's nearest-owner behavior is intentionally preserved. L2 required no Firefox-specific change.

Final automated verification:

- `pnpm check` — 41/41 tasks.
- `pnpm build` — 10/10 tasks.
- Isolated `E2E_GROUP=next` — 27/27 tests.
- Isolated full `pnpm e2e` — 168/168 tests.
- `pnpm package-contract` — clean build, tarball inspection, temporary-consumer install/import.
- Unified Chrome and Firefox release pipeline — both production builds and ZIPs completed; startup graph gate passed.

The manual headed extension-upgrade smoke test remains a release checklist item; it was not represented as an automated pass here.
