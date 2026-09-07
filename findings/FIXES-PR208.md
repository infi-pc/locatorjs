# Fixes — PR 208 (v2)

Base: `master` · Created: 2026-09-03 · Source reviews: CR1

Original PR size: +44,257/−16,553 · Cumulative fix rounds: +0/−0

**Active plan:** ROUND-2 below supersedes the unimplemented ROUND-1 recommendations. ROUND-1 remains historical evidence, not the current default. On 2026-09-07 the user selected origin trust with an always-trusted `localhost:*` exception. ROUND-2 is still planning only; implementation and the other proposed residual limitations have not been approved.

**Start-here handoff:** [IMPLEMENTATION-PR208.md](IMPLEMENTATION-PR208.md) contains the selected execution instructions, exact edit/test map and stopping rules for the implementing agent. This ledger remains the status owner. The 2026-09-07 handoff refinement clarifies ROUND-2; it is not a new fix round or implementation approval.

## Findings ledger

| Finding | Headline                                     | S/F → P    | Status                                            | Plan          | Commit |
| ------- | -------------------------------------------- | ---------- | ------------------------------------------------- | ------------- | ------ |
| CR1-1   | Websites can read private extension settings | S0/F2 → P0 | planned; origin trust + localhost policy selected | ROUND-2 / FP1 | —      |
| CR1-2   | Corrupt global settings cannot be reset      | S1/F2 → P1 | planned                                           | ROUND-2 / FP2 | —      |
| CR1-3   | Setup finishes without a working editor      | S1/F1 → P1 | planned                                           | ROUND-2 / FP3 | —      |
| CR1-4   | Published Node entry cannot be loaded        | S1/F2 → P1 | planned                                           | ROUND-2 / FP4 | —      |
| CR1-5   | External source files open nonexistent paths | S1/F2 → P1 | planned                                           | ROUND-2 / FP5 | —      |
| CR1-6   | Reset can resurrect deleted settings         | S1/F3 → P2 | planned; concurrent-context residual proposed     | ROUND-2 / FP6 | —      |
| CR1-7   | Disabled startup loses closed shadow roots   | S1/F3 → P2 | planned                                           | ROUND-2 / FP7 | —      |

## ROUND-1 — 2026-09-03 · input CR1 @ e425a23c51187ca8d0f8d213aa89417a5fb89f0e · gate: waiting (taste)

### Dashboard

new 7 · reopened 0 · verified-closed 0 · standing 0 · fix-round net LOC +0/−0

### Plans

| Plan | Problem → default solution                                                                                                                                                                                                                                                   | Covers             | Choice         | Est. net LOC            |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | -------------- | ----------------------- |
| FP1  | **Websites can read private extension settings.** Any page can exfiltrate the complete All sites layer.<br>✅ **Default A:** expose only the safe projection and temporarily withhold extension-provided sensitive actions until a separately reviewed secure broker exists. | CR1-1 (S0/F2 → P0) | A / B · taste  | A −10…+35 · B +140…+230 |
| FP2  | **Corrupt global settings cannot be reset.** Connected users are shown recovery copy, but Reset clears This site.<br>✅ **Default A:** add a dedicated, confirmed Reset All sites action beside the warning.                                                                 | CR1-2 (S1/F2 → P1) | A / B · taste  | A +33…+53 · B +20…+34   |
| FP3  | **Setup finishes without a working editor.** Both guides can claim completion without a saved destination.<br>✅ **Default A:** consumers own editor validity while Wizard exposes disabled Continue/Finish affordances; only explicit Skip bypasses the requirement.        | CR1-3 (S1/F1 → P1) | A / B · taste  | A +70…+115 · B +55…+95  |
| FP4  | **Published Node entry cannot be loaded.** Native import and CommonJS require fail although webpack validation passes.<br>✅ **Default A:** publish explicit native ESM and CJS bundles and execute their installed exports in the contract gate.                            | CR1-4 (S1/F2 → P1) | A / B · taste  | A +75…+120 · B +40…+80  |
| FP5  | **External source files open nonexistent paths.** Absolute source-map paths lose provenance and receive the project root twice.<br>✅ **Default A:** carry an optional absolute/project-relative discriminant from authoritative producers.                                  | CR1-5 (S1/F2 → P1) | A / B · taste  | A +35…+60 · B +70…+110  |
| FP6  | **Reset can resurrect deleted settings.** Clear bypasses the mutation queue used by patch writes.<br>✅ **Default A:** route every extension-config mutation through one queue helper.                                                                                       | CR1-6 (S1/F3 → P2) | A / B · taste  | A +28…+42 · B +24…+37   |
| FP7  | **Disabled startup loses closed shadow roots.** Tracking starts too late to observe irreversible closed-root creation.<br>✅ **Default A:** install lightweight tracking after every successful setup, independently of enabled UI state.                                    | CR1-7 (S1/F3 → P2) | A · mechanical | −2…+12                  |

#### Coverage

| Finding | Exactly one plan |
| ------- | ---------------- |
| CR1-1   | FP1              |
| CR1-2   | FP2              |
| CR1-3   | FP3              |
| CR1-4   | FP4              |
| CR1-5   | FP5              |
| CR1-6   | FP6              |
| CR1-7   | FP7              |

#### Bloat meter

Recommended defaults total an estimated **net +229…+437 LOC**, approximately **0.8%…1.6%** of the original PR's net +27,704 LOC. No fix LOC has landed yet.

### FP1 — Keep extension secrets out of the page world · covers CR1-1 (S0/F2 → P0)

🚨 **Problem:** Any top-level page can request and read the complete All sites settings layer, exposing local project paths, editor and prompt templates, path rewrites, tmux sessions, and configured destinations. Renderer detection, same-window messages, and top-frame checks do not make page-owned JavaScript trustworthy.

✅ **Default — A: publish only a safe projection and withhold sensitive extension actions.** Make `safeFrameProjection()` the only extension data ever written to DOM or sent toward the MAIN world. Remove the full-settings request path; retain non-sensitive page-side actions such as Show tree/Show parents, and report extension-provided editor/copy/prompt actions as unavailable until a secure broker exists.

🔎 **Planning detail — invariant:** Extension-local machine settings must never enter page-visible DOM, globals, events, messages, snapshots, or action payloads.

**Defect class and sweep:** The class is “isolated-world secrets cross into a page-owned channel after an untrusted capability check.” In `origin/master...HEAD`, the primary instance is the full-layer dataset write in `Content/index.ts`. The same data is then reachable through the runtime snapshot and page-snapshot response path; request IDs authenticate neither caller nor responder. Same-window source, renderer presence, frame position, same origin, and runtime globals are all page-controlled. Popup-to-content extension messages remain inside the trusted boundary. Page-local settings and the existing safe projection do not contain machine-secret siblings.

🔀 **Alternative B — isolated action broker.** Keep the private layer solely in the content script; accept narrowly validated source/action requests correlated with a recent trusted DOM gesture, consume authorization once, resolve the private destination in the isolated world, and return only a generic result.

📏 **Size:**

- **A — safe projection plus explicit action withholding:** net −10…+35 LOC; 90…150 touched LOC across content publication/projection/snapshot tests and runtime action-unavailable behavior. Test cost: a hostile-page integration matrix plus focused projection/action tests.
- **B — isolated action broker:** net +140…+230 LOC; 280…430 touched LOC across roughly 10–15 content/runtime/shared protocol, gesture, resolution, and test files. Test cost includes forgery, replay, expiry, storage change, navigation, frame, and every sensitive action case.

🧪 **Proof:** In a real extension-content integration harness, store sentinel values for `projectPath`, custom editor/prompt templates, `replacePath`, and `tmuxSession`; load an ordinary hostile page and dispatch `LOCATOR_RUNTIME_SETTINGS_REQUEST`. Assert the sentinel never appears in document attributes, observed same-window messages, runtime snapshots, or forged snapshot-response paths. Repeat after storage update and in top-level, same-origin-frame, and cross-origin-frame contexts. Under A, also assert sensitive actions are unavailable while Show tree/Show parents still work.

⚠️ **Trade-offs:** A decisively closes the leak with a small boundary but temporarily removes extension-provided editor, copy-path, and prompt behavior; site/team configuration remains usable. B preserves those features but creates a security-sensitive capability protocol and retains the risk that hostile code races a legitimate gesture. A's residual exposure is limited to the reviewed safe projection.

🚫 **Avoid:** Do not strengthen `canReceiveFullSettings()`, add a nonce to ordinary `window.postMessage`, trust renderer detection, move the data to another page-visible object, or delete the dataset only after startup. Page code can observe or invoke every MAIN-world mechanism.

**Recommendation: A — taste.** It is the only small change that restores confidentiality decisively; a secure broker can be designed and reviewed separately.

🔗 **Dependencies:** No prerequisite. FP1-A is disjoint from FP2/FP6 production files; FP1-B would overlap the shared action protocol and should precede action-facing UI work.

### FP2 — Make rejected All sites settings recoverable · covers CR1-2 (S1/F2 → P1)

🚨 **Problem:** A connected user can see that All sites settings are incompatible or corrupt, but the visible Reset still clears This site. The bad global record remains, so All sites cannot be edited and the advertised recovery does not work.

✅ **Default — A: give the warning its own All sites recovery action.** Add a clearly labeled, confirmed recovery action beside the incompatible-format warning and bind it directly to `clearUserExtension`. Keep ordinary Reset tied to the user-selected scope.

🔎 **Planning detail — invariant:** Every rejected persistent format has a reachable operation that clears that exact record, regardless of popup connectivity or currently editable scope.

**Defect class and sweep:** The class is “a recovery command derives its destructive target from the active editing scope even though the rejected record disables that scope.” The three rejected extension states—`reset-required`, `future-version`, and `corrupt`—all join this plan. Rejected site-local state is not a sibling because its This site reset remains directly reachable; the runtime settings surface has only one persistent scope. No pre-existing instance exists on `origin/master`.

🔀 **Alternative B — temporarily retarget ordinary Reset.** Make ordinary Reset clear All sites whenever the global record is rejected, even if This site is currently selected.

📏 **Size:**

- **A — dedicated recovery action:** net +33…+53 LOC; 43…69 touched LOC across `Home.tsx` and `Popup.test.tsx`. Production +8…+18; tests +25…+35 for a rejected-kind/connectivity matrix.
- **B — force ordinary Reset to All sites while rejected:** net +20…+34 LOC; 30…48 touched LOC in the same files. Production +1…+4; tests +19…+30.

🧪 **Proof:** Render the real popup/Home path with a valid connected snapshot and `extensionConfigRead().kind === "future-version"`. Trigger recovery, confirm it, and assert `clearUserExtension` runs once while `clearSiteLocal` does not. Parameterize `reset-required`, `future-version`, and `corrupt` across connected/disconnected states; keep valid-state scope-selection tests green.

⚠️ **Trade-offs:** A adds modest warning/footer density but keeps both reset capabilities explicit. B is smaller but temporarily makes This site reset unreachable while All sites is rejected and leaves the warning spatially separate from its action.

🚫 **Avoid:** Do not enable editing against rejected data, silently overwrite future-version data, clear both scopes together, or tell users to disconnect first.

**Recommendation: A — taste.** The correct target is mechanical, but whether recovery gets a dedicated action or commandeers ordinary Reset is product-visible.

🔗 **Dependencies:** No implementation dependency on FP6 and no production overlap. FP6 is still required to make the successful recovery durable.

### FP3 — Setup cannot complete without a saved editor · covers CR1-3 (S1/F1 → P1)

🚨 **Problem:** First-run users can reach “You're ready” or close onboarding while Open in editor still has no destination. The extension also accepts an empty custom template as successful setup.

✅ **Default — A: validate in each onboarding flow and expose validity through Wizard.** Each flow derives usability from the authoritative effective setting (`editor.kind === "selected"`). Wizard receives generic continuation/finish validity for button state, while transition and completion handlers recheck the invariant before advancing or dismissing.

🔎 **Planning detail — invariant:** Finish/Done may dismiss guided setup only after a usable editor destination is successfully persisted; only separately labeled Skip setup may bypass the requirement.

**Defect class and sweep:** The class is “an ungated wizard treats a suggested/default-looking value or empty draft as successfully persisted configuration.” In-diff instances include Wizard's unconditional Continue/Finish, WelcomeScreen's editor transition and dismissal, extension Onboarding's Continue, empty-custom branch, and Done, plus an existing Playwright path that codifies invalid advancement. No further instance exists in the changed wizard surfaces.

🔀 **Alternative B — keep Wizard presentation-neutral.** Reject invalid Continue/Finish inside both onboarding consumers without adding a shared disabled-state contract.

📏 **Size:**

- **A — shared affordance, consumer-owned validation:** net +70…+115 LOC; 110…175 touched LOC across Wizard, both flows, their unit tests, and the existing Playwright onboarding path.
- **B — consumer-only handlers:** keep Wizard presentation-neutral and reject invalid Continue/Finish inside both flows. Net +55…+95 LOC; 90…145 touched LOC. Test cost is nearly the same, but logic is duplicated and enabled buttons can appear inert.

🧪 **Proof:** Change the runtime Playwright path so `needs-selection` cannot leave Pick your editor or finish until a successfully saved editor exists; keep explicit Skip separately covered. Add extension component coverage for no selection, whitespace custom template, failed persistence, successful save, and Done. Add a Wizard test for disabled Continue/Finish with Skip independently available.

⚠️ **Trade-offs:** A changes generic Wizard button semantics but leaves domain validity at authoritative consumers. Direct tab closure remains abandonment, not recorded success. The extension gains explicit Skip semantics: close without persisting an editor or presenting completion. Runtime Skip keeps its current deliberate dismissal behavior and later editor-required actions may reopen setup.

🚫 **Avoid:** Do not promote the default VS Code suggestion to a saved choice, auto-save on Continue, treat blank custom input as cancellation, or rely only on disabled buttons without guarding completion handlers.

**Recommendation: A — taste.** Validation ownership is clear, but adding extension Skip and choosing disabled-versus-rejected interaction are product-visible.

🔗 **Dependencies:** Wizard API/tests first, then the two consumers. No dependency on other plans.

### FP4 — Make every published runtime entry natively loadable · covers CR1-4 (S1/F2 → P1)

🚨 **Problem:** Native Node and CommonJS consumers cannot load the advertised runtime packages. The package-contract gate passes only because webpack repairs the invalid graph while bundling.

✅ **Default — A: publish explicit native ESM and CJS bundles.** Keep the browser-oriented graph, generate standalone `.mjs`/`.cjs` entries for `@locator/shared` and the runtime server surface, route import/require/node/worker/deno conditions explicitly, and execute every installed condition in the package contract.

🔎 **Planning detail — invariant:** Every advertised export condition loads from installed tarballs under pinned Node 22 without bundler resolution.

**Defect class and sweep:** The class is “ambiguous `.js` ESM with extensionless imports, validated only through a bundler.” It affects runtime and shared emitted graphs, while `locatorjs` exposes it through `require("@locator/runtime")`. All advertised native conditions join this plan. No equivalent native-export contract existed on `origin/master`.

🔀 **Alternative B — normalize the complete module graphs.** Add explicit ESM specifiers throughout runtime/shared, declare the ESM package boundary, and emit parallel CJS trees with matching conditional exports.

📏 **Size:**

- **A — standalone native bundles:** net +75…+120 LOC; 130…210 touched LOC across runtime/shared/locatorjs package manifests and entries, package-contract code, and native-entry build config. Test cost: installed-consumer import/require plus condition probes.
- **B — normalize complete source graphs:** add explicit specifiers, declare ESM, and emit parallel CJS trees. Net +40…+80 LOC but 350…550 touched LOC across roughly 70–100 runtime/shared source and config files.
- **Ruled out — CJS for every condition:** net +35…+60 LOC; 70…120 touched LOC, but it leaves worker/Deno and true ESM semantics unresolved and therefore does not restore the advertised contract.

🧪 **Proof:** Pack/install tarballs, then under Node v22 execute native `import("@locator/runtime")`, `require("@locator/runtime")`, `require("locatorjs")`, direct shared import/require, and `--conditions=worker`/`--conditions=deno` probes. Current runtime import misses `dist/functions/reportSetupErrors`; compatibility require misses `shared/dist/isValidRenderer`.

⚠️ **Trade-offs:** A adds build configuration and bundles a small server/shared surface, with residual divergence risk contained by installed-tarball probes. B is conceptually pure but churn-heavy. C does not fulfill all advertised conditions.

🚫 **Avoid:** Do not add only `"type": "module"`, patch one `.js` suffix, or validate another webpack bundle.

**Recommendation: A — taste.** It restores the coherent public contract with materially less source churn than B.

🔗 **Dependencies:** Native outputs must be generated before packing. Independent of FP5/FP7.

### FP5 — Preserve source-path provenance through navigation · covers CR1-5 (S1/F2 → P1)

🚨 **Problem:** Absolute POSIX paths from source maps become fabricated project-relative paths outside the configured root. Editor links, copied paths, and prompts all target nonexistent files.

✅ **Default — A: carry an explicit path-origin discriminant.** Add optional absolute/project-relative provenance to source and link data, mark source-map results at their authoritative boundary, propagate it unchanged, and let unmarked legacy `/src/...` inputs retain project-relative behavior.

🔎 **Planning detail — invariant:** A path known absolute remains byte-for-byte absolute outside the project root, while legacy Babel `/src/...` remains joinable to the configured project.

**Defect class and sweep:** The class is “provenance is discarded before an ambiguous string is normalized.” In-diff siblings include original-position resolution, React source-to-link conversion, tree-row conversions, and editor link/copy-path/prompt consumers. Svelte/Vue/JSX/Babel inputs remain intentionally unmarked. No pre-existing centralized instance exists on master because this source-path flow is new in the diff.

🔀 **Alternative B — replace strings with a tagged path value.** Migrate every producer and consumer to a `SourcePath` value object that makes absolute versus project-relative provenance mandatory at compile time.

📏 **Size:**

- **A — optional discriminant:** net +35…+60 LOC; 90…140 touched LOC across shared/runtime source types, source-map resolution, React/tree propagation, the three consumers, and focused tests.
- **B — tagged `SourcePath` value object:** net +70…+110 LOC; 160…240 touched LOC across 12–18 adapter, tree, UI, action, and test files. It strengthens compile-time enforcement but broadens migration risk.

🧪 **Proof:** Resolve a real source-map fixture containing `file:///Users/me/app-old/src/page.tsx`, propagate it through production link/action code with root `/Users/me/app`, and assert editor URL, copied path, and prompt retain the external path. In the same suite, assert unmarked `/src/Button.tsx` still becomes `/Users/me/app/src/Button.tsx`.

⚠️ **Trade-offs:** A depends on knowledgeable producers setting provenance; unknown legacy sources remain ambiguous. B removes that residual but is disproportionate for the demonstrated source-map path.

🚫 **Avoid:** Do not treat every leading slash as absolute, guess from path depth, or inspect filesystem existence from browser code.

**Recommendation: A — taste.** The discriminant is the narrow authoritative repair, but its public type shape is a design choice.

🔗 **Dependencies:** None. It overlaps runtime/shared types, not FP4 build surfaces.

### FP6 — Make clear an ordered extension-config mutation · covers CR1-6 (S1/F3 → P2)

🚨 **Problem:** Reset can report success and show empty settings, then a previously accepted delayed write restores the deleted record. The inverse overlap can erase a patch accepted after Reset.

✅ **Default — A: serialize every extension-config mutation through one queue boundary.** Extract the queue scheduling into one private enqueue helper and route patch and clear through it. Update readiness only inside the queued clear after storage removal succeeds.

🔎 **Planning detail — invariant:** A successful clear runs after every extension-config mutation accepted before it and before every mutation accepted after it.

**Defect class and sweep:** The class is “operations mutating one persistent record only partially share its serialization boundary.” `clearExtensionConfig()` is the sole in-diff config mutation bypassing `pendingMutation`; migration completes before mutations, reload markers use separate keys, and synchronous site storage is not a sibling. No pre-existing instance exists on master.

🔀 **Alternative B — chain clear directly.** Put clear on `pendingMutation` locally while leaving `mutate()`'s queue plumbing in place.

📏 **Size:**

- **A — shared enqueue helper:** net +28…+42 LOC; 45…65 touched LOC across `storageContract.ts` and focused storage tests. Production +4…+10; tests +24…+34.
- **B — chain clear directly:** net +24…+37 LOC; 38…58 touched LOC in the same files. It restores current ordering with duplicated queue-maintenance logic and makes future bypasses easier.

🧪 **Proof:** With controlled storage promises, prove patch-before-clear delays removal until persistence finishes and leaves no key; prove patch-after-clear delays persistence until removal finishes and leaves revision 1. Keep migration, no-op, ordinary clear, and storage-rejection cases green.

⚠️ **Trade-offs:** A makes clear wait for earlier accepted writes and centralizes rejection recovery; future mutations must still use the helper. B is slightly smaller but preserves the defect class structurally.

🚫 **Avoid:** Do not patch popup signals, ignore stale completion, add a timeout/generation-only guard, or serialize only the UI caller.

**Recommendation: A — taste.** Ordering is mechanical, but choosing a shared boundary over a smaller duplicate implementation affects maintainability.

🔗 **Dependencies:** No file overlap with FP2. FP2 recovery becomes durable only after FP6.

### FP7 — Start closed-root tracking after every successful setup · covers CR1-7 (S1/F3 → P2)

🚨 **Problem:** A library configured as disabled misses closed shadow roots created before later activation, making their contents permanently undiscoverable.

✅ **Default — A: install tracking at the successful setup boundary.** After validation and configuration commit, install the lightweight shared registry unconditionally; remove the disabled predicate and redundant activation-time install where safe, while keeping visual runtime loading conditional.

🔎 **Planning detail — invariant:** Every closed root created after successful library setup is recorded regardless of visual enabled state.

**Defect class and sweep:** The class is “instrumentation needed for irreversible events is deferred behind a UI-state predicate.” The conditional setup and activation-time installation are the in-diff instances. Shared getters self-install but cannot recover old closed roots. The extension document-start hook is already unconditional and excluded. Invalid setup must still return before mutation, timers, or tracking.

📏 **Size:** A net −2…+12 LOC; 15…35 touched LOC across runtime setup/init and focused tests. Ruled out alternatives are installing on enable subscription (still too late) and module evaluation (patches pages on import and before invalid setup).

🧪 **Proof:** Call real `setup({disabled:true})`, create a closed root immediately, and assert the registry resolves it before enablement; then enable/activate and verify the child remains discoverable. Preserve the assertion that invalid setup invokes neither tracking nor runtime initialization.

⚠️ **Trade-offs:** Successful disabled setup now installs one global idempotent `attachShadow` patch but still loads no visual UI. Residual risk is limited to that intentional lightweight instrumentation.

🚫 **Avoid:** Do not scan or retry only at activation; closed roots cannot be reconstructed.

**Recommendation: A — mechanical.** One bounded solution restores behavior already established by the registry and invalid-setup contracts.

🔗 **Dependencies:** None. Extension files remain untouched.

### Decisions

Pending user decision. Reply grammar: `FP1-A, FP3-B`; unmentioned plans take their stated defaults. A bare `go` adopts every default.

### Outcomes

Pending implementation after the decision gate.

### Verification

- Baseline `pnpm check` under the shell's Node 26: failed only at `@locator/web#build` because the local darwin-arm64 `sharp` optional binary is unavailable; 40/41 Turbo tasks completed.
- Baseline `pnpm check` with pinned Node v22.23.2 selected: same pre-existing workspace failure at `@locator/web#build`; 40/41 Turbo tasks completed.
- No implementation or post-fix verification has run.

## ROUND-2 — 2026-09-06 · input CR1 @ e425a23c51187ca8d0f8d213aa89417a5fb89f0e · planning only

### Outcome and scope

Make the supported click-to-source, configuration, and package-loading workflows reliable while concentrating each rule in its existing owner. This is a replacement plan for the seven current findings, informed by the earlier remediation in PR #221; it is not another open-ended review of v2.

The user's request is: “ok, let's plan /plan the implementation (proper and maintainability aware)”. This authorizes preparing the plan, not implementing its proposed changes. On 2026-09-07 the user resolved the privacy design in favor of trusting approved pages, adding always-trusted `localhost:*`. The amendment below records that policy choice; it does not start implementation.

**Source scope:** CR1 reviewed the whole PR #208 against master. **Implementation base:** this workspace's `origin/v2`, currently the same `e425a23c51187ca8d0f8d213aa89417a5fb89f0e` as the reviewed head. Current branch is `infi-pc/review-pr-208`; it has no separate PR. Keep this existing PR208 ledger and use v2 as the integration target. Do not rename the branch.

The original S/F → P labels below are retained for traceability. They are not new severity assessments or automatic instructions to expand scope. PR221's historical finding IDs are a different inventory and are not imported as additional work.

### Dashboard and decision sheet

new 0 · known-open 7 · reopened 0 · verified-closed 0 · standing 0 · implemented +0/−0

| Plan | Problem → proposed default                                                                                                                                                                                   | Covers             | Decision                                                     | Net production/build | Net tests | Net total                |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ | ------------------------------------------------------------ | -------------------- | --------- | ------------------------ |
| FP1  | **Ordinary websites can read global settings.** Always trust HTTP(S) localhost on any port; require popup approval for other exact origins. One content-owned rule controls all private data sent to a page. | CR1-1 (S0/F2 → P0) | A: origin trust + localhost selected; implementation pending | +180…+320            | +250…+450 | +450…+800 including copy |
| FP2  | **Rejected globals have no reachable recovery.** Add a direct All sites recovery action and capture the confirmed reset target.                                                                              | CR1-2 (S1/F2 → P1) | A, taste                                                     | +12…+30              | +65…+110  | +77…+140                 |
| FP3  | **Setup can claim completion before saving an editor.** Keep draft/save ownership in each picker and flow; Wizard only presents navigation availability.                                                     | CR1-3 (S1/F1 → P1) | A, taste                                                     | +65…+115             | +150…+260 | +215…+375                |
| FP4  | **Published native entries do not load.** Reuse webpack for coherent native output and test the installed JavaScript and declaration interfaces.                                                             | CR1-4 (S1/F2 → P1) | A, taste                                                     | +140…+230            | +100…+170 | +240…+400                |
| FP5  | **Known absolute sources become fabricated paths.** Preserve path meaning at producers and carry it through the existing source/link shapes.                                                                 | CR1-5 (S1/F2 → P1) | A, taste                                                     | +55…+100             | +100…+180 | +155…+280                |
| FP6  | **Reset can lose its ordering against writes.** Remove cached readiness and put initialization, patch, and raw clear on one queue within each storage context.                                               | CR1-6 (S1/F3 → P2) | A, taste; cross-context limitation proposed                  | −10…+20              | +80…+145  | +70…+165                 |
| FP7  | **Disabled startup misses later closed roots.** Install the existing tracker after every successful setup, retaining lazy visual activation.                                                                 | CR1-7 (S1/F3 → P2) | A, taste: accept existing scan during disabled setup         | −2…0                 | +25…+50   | +23…+50                  |

**Checked estimates, revised 2026-09-07:** production/build +440…+815; tests/fixtures +770…+1,365; copy/docs +20…+30; total +1,230…+2,210 authored lines. Generated artifacts and planning records are excluded. The reduction is FP6's removal of cached readiness. These are broad planning ranges, not measured implementation results. Counts assume extending the existing unit, installed-consumer, and extension fixtures; do not add a second harness for the same purpose.

These supersede ROUND-1's much smaller estimate, which omitted necessary disclosure paths, picker draft state, declaration compatibility, shared native module identity, and source producers. LOC is a cost signal, not the reason to choose a design. Report actual production and test deltas separately. If a plan exceeds roughly 1.5 times its upper estimate or needs another persistent state/protocol, re-scope that plan before proceeding.

**Coverage:** CR1-1→FP1; CR1-2→FP2; CR1-3→FP3; CR1-4→FP4; CR1-5→FP5; CR1-6→FP6; CR1-7→FP7. Each finding appears in exactly one plan. Residual limitations are attached to the owning plan; none is silently treated as fixed or already accepted.

### Maintenance constraints

- Keep the strict configuration parser, explicit editor/action types, and set/unset patches. Each fix uses those existing contracts.
- Prefer removing a bad predicate or discarding less information over adding another guard. When enforcement is needed, identify one owner that all relevant callers cross.
- Configuration representation cleanup is not a separate workstream. Simplify a conversion only where necessary to carry a path, expose picker state, or enforce the chosen access rule.
- Preserve the released-v1 migration policy and explicit reset for unreleased previews. Do not add another configuration version or a generic migration framework.
- Keep real user guarantees separate from unpromised conditions. No background transaction system, generic command bus, form-validation framework, or new source-resolution strategy is included.
- Tests assert observable results at the relevant interface. Reuse or replace overlapping tests; do not multiply every scenario across every internal helper.

### FP1 — Share settings with localhost and explicitly approved origins

**Covers:** CR1-1 (S0/F2 → P0).

🚨 **Problem:** An arbitrary enabled top-level page can request private All sites settings. Popup Try and This site writes are additional routes that can send private values into the page.

✅ **Selected design A, amended 2026-09-07:** Always trust HTTP(S) origins whose parsed hostname is exactly `localhost`, on any port including the default port. Other HTTP(S) origins require explicit, persisted approval in the extension popup. The isolated content script applies one access decision to every private-data publication. Preserve editor, clipboard, and prompt actions on trusted origins using the current runtime execution path.

🔎 **Planning detail — selected invariant:** Machine-specific extension configuration is disclosed only to HTTP(S) localhost origins or exact origins explicitly approved by the user. This deliberately changes the original stronger “never page-visible” invariant. Every script on a trusted origin, including third-party scripts or XSS, can read the shared settings. Every localhost project/port is trusted, not just the current project. There is no automatic grant for dev renderers, `*.localhost`, `localhost.`, `127.0.0.1`, `[::1]`, LAN addresses, or domains resolving to loopback; those can use ordinary exact-origin approval. This keeps the requested exception literal rather than silently expanding it.

**Owner and implementation:**

1. Add a small extension-local `originAccess.ts`, separate from layered Locator configuration. After validating the browser-derived HTTP(S) identity, evaluate one rule: parsed hostname is exactly `localhost`, or the exact origin has a stored grant. Use URL parsing, not prefix/substring checks, DNS lookups, or `isSecureContext`. Store independent keys `trustedOrigin:<canonical origin>` with literal `true` for explicit grants; absence or malformed values deny access outside the localhost exception. Grant/revoke writes one exact key, avoiding a shared allowlist read/modify/write race. Popup-owned calls are the only exposed mutation route; no MAIN-world permission messages exist. The localhost rule is derived, not persisted as per-port entries or a new preference/denylist.
2. Add one stateless content-to-background identity request. Derive the effective origin from the browser's `MessageSender.origin`, verifying an internal extension sender with a tab/frame. Missing, opaque, or non-HTTP(S) identity denies access. Do not infer identity from page snapshots, DOM attributes, request body origins, referrers, or URL heuristics.
3. In `Content/index.ts`, keep resolved identity, current approval, and current layer together. Pass a narrow access accessor to `mountSnapshotBridge`. Reuse this decision for dataset publication, Try payloads, and This site patches. An incoming page request can coordinate startup but cannot authorize disclosure. Remove `fullSettingsRequested` as a permission latch and remove the unconditional top-frame authorization.
4. Keep the existing public projection. Publish the complete layer only when trusted and enabled. Automatic localhost trust does not enable Locator, inject it into additional pages, or widen browser host permissions. Initial asynchronous reads and deferred document-element callbacks must consult current access/layer state, so newer changes cannot be overwritten by stale initialization. Use the existing local change-revision pattern where needed, without a new lifecycle abstraction.
5. Extend the existing trusted popup/content response and provider with access metadata, independently of page snapshot success. Display the full origin and a compact Allow/Revoke control for non-localhost origins even if no runtime is connected. For localhost show “Localhost is always trusted” rather than a nonfunctional Revoke button; derive the reason from the same access owner. All sites editing remains available. Try and This site writes require trust; the content script enforces this even if the UI is bypassed. Snapshot inspection and site clearing may continue because they carry no private extension payload.
6. Capture the origin displayed to the user for grant/revoke, and retain the tab identity for page operations. Try/site-write requests carry the expected origin; the recipient compares it with its browser-derived identity before relaying private data. Navigation must not silently retarget an operation to a different origin. Access metadata never comes from `validateSnapshot` output.
7. Reuse `editorWithheld` for the runtime notice, changing its current cross-origin-only explanation to direct users to the extension popup. Preserve existing update/reload-required handling for tabs containing old injected code.

**Pinned handoff details:** Popup/content protocol moves from 3 to 4, with validated access metadata beside every snapshot response; stale or malformed protocol means reload-required. Page-world/config versions do not change. Capture displayed tab ID and exact origin for Try, site patch and site clear, with expected-origin checks at content; never re-query the active tab to retarget them. Only private patch/Try require trust. Automatic full-layer publication also requires an enabled extension layer, but do not add that disabled gate to explicit patches: trusted users must be able to re-enable. Existing runtime effective-disabled rejection of Try remains. The handoff specifies initialization failure/revision handling, stale poll results and real connected-popup fixture setup. HTTPS/default-port truth-table coverage is unit coverage, not a claim of live HTTPS testing.

**Update limitation:** The new policy is enforced by updated content scripts. Tabs retaining old injected code can retain prior disclosure behavior until reloaded; protocol 4 only blocks new-popup use of the stale bridge. Preserve the visible reload-required action, do not auto-reload all tabs, and report this limit. Add a production-entry Content/index.test.ts; snapshotBridge tests alone do not prove startup ordering.

**Frames and lifecycle:** Each frame uses its own effective origin. Same-origin and nonopaque inherited-origin frames get the same origin's access decision. Cross-origin frames do not inherit a parent's trust; each independently qualifies through localhost or its own exact grant. Opaque frames remain withheld even when their URL mentions localhost. Existing installations retain configuration and start without explicit grants; localhost qualifies immediately under the new policy. Configuration reset and origin revocation stay separate operations. Revocation of an explicit non-localhost grant stops subsequent sharing after storage-change propagation; it cannot retract already disclosed values or promise cancellation of page-side work already queued. A new/reloaded document starts under the revoked policy. All-port trust does not make different localhost ports the same origin: expected-origin checks still reject navigation retargeting between them.

**Interface and files:** `originAccess.ts`; Background/index.ts; Content/index.ts, snapshotBridge.ts, settingsProjection.ts; Popup/syncedState.tsx and Popup/Home display; Runtime.tsx notice; extension documentation. No new browser permission is expected. Chrome and Firefox origin metadata support must be verified by integration on the supported manifest versions; a Node unit mock is not that proof.

**Class sweep:** Startup dataset, subsequent config/grant changes, settings requests, deferred publication, popup Try, and popup This site patches all join this plan. Page-supplied snapshot data remains untrusted display/site data, as before. Do not attempt to authenticate page-world runtime code.

🧪 **Red proof:** With sentinel path/template/session values in extension storage, a real unapproved non-localhost page must fail to observe them through attributes or messages, including forged settings requests, forged snapshots, Try, and site patches. Approve the exact origin through the real popup and prove normal actions work. Verify denial on another non-localhost port/origin and opaque frame, inheritance only for the same effective origin, rejection after origin mismatch, and withholding after revocation/reload. Separately prove localhost works without stored grants across ports, HTTP/HTTPS and default ports, while preserving disabled behavior. Add compact predicate cases for parsed hostname equality, `localhost.evil.example`, `localhost@evil.example`, aliases requiring explicit approval, and missing/opaque identity. Reuse the real fixture on an explicitly non-auto-trusted host such as `127.0.0.1` for denial/grant tests; a localhost denial test would now assert the wrong policy. Add controlled initial-read/deferred-publication cases in the content integration tests. Reuse the existing headed extension fixture; add any new spec to its e2e group. Run a real Firefox MV2 identity/approval spot-check separately from the Chromium extension test.

📏 **Size:** Net production +180…+320, tests +250…+450, copy +20…+30; total +450…+800; approximately 12–18 authored files, roughly 650–1,100 touched lines. Production cost is primarily the explicit consent feature and one shared egress policy, not another configuration representation.

🔀 **Alternative B:** Keep settings private from every page by resolving and executing authorized actions in extension-owned code. It must also prevent attacker-controlled page/team destinations from receiving expanded private values, arm Try without sending its private action, and implement private clipboard/navigation effects for Chrome MV3 and Firefox MV2. A recent click token alone is insufficient. This likely needs +800…+1,500 total authored lines, with low confidence, and changes action-composition semantics. Choosing B requires revising FP1's execution design before implementation; the old +140…+230 estimate is not credible for the complete requirement.

⚠️ **Trade-offs:** A introduces one explicit approval per non-localhost origin and deliberately trusts scripts on all localhost ports without a prompt. A downloaded/untrusted project or compromised script served locally can therefore read the shared global settings; local delivery does not prove application ownership or safety. B preserves the stronger confidentiality guarantee with a larger implementation. Removing core extension actions is not a recommended shipping alternative. The localhost exception stays within the existing broad estimate: one predicate, derived UI copy, and additional rows in existing tests, not a second permission mechanism.

🚫 **Avoid:** More renderer checks, public nonces, page-controlled origin assertions, a second allowlist array/queue, or independent checks at each runtime action. The single access owner replaces the existing faulty authorization.

**Decision:** A with automatic HTTP(S) localhost trust, selected by the user on 2026-09-07. Non-localhost origins still require individual runtime approval. This selects the design, not authorization to implement the round or operate on live browser permissions.

**Policy amendment — 2026-09-07:** User: “ok, definitely trust the pages, plus I would make localhost:\* always trusted for practical reasons - is that ok?” Recommendation: yes for Locator's development workflow, with the disclosure trade-off above made explicit. The browser's potentially-trustworthy-origin classification concerns secure delivery, not whether a particular application should receive private extension settings ([Secure Contexts §3.1](https://www.w3.org/TR/secure-contexts/#is-origin-trustworthy)). Retain browser-provided sender origin rather than page-controlled URL claims ([Chrome MessageSender](https://developer.chrome.com/docs/extensions/reference/api/runtime#type-MessageSender)). No code or browser permissions changed in this amendment; no new fix round or gate run is needed for this planning-only policy update.

### FP2 — Make the confirmed reset identify its target

**Covers:** CR1-2 (S1/F2 → P1).

🚨 **Problem:** Rejected All sites data disables selecting that scope, leaving connected users with a reset that clears This site instead.

✅ **Default A:** Add a clearly labeled All sites reset beside the warning, using the existing confirmation UI. Make the confirmation store the exact scope it will clear.

🔎 **Planning detail — invariant:** Every rejected global record has reachable recovery, and the confirmed target is the one cleared regardless of subsequent scope/connectivity changes.

**Implementation:** In `Home.tsx`, replace `confirmReset: boolean` with `"user-origin" | "user-extension" | undefined`. Ordinary Reset captures the existing resetLayer target; recovery captures `user-extension`. Derive confirmation text, storage operation, and error text from that captured value, rather than re-reading scope after an await. Remove the connectivity effect that automatically dismisses confirmation; only an explicit user scope change may cancel an idle confirmation. Disable duplicate/cancel actions during reset, leave failed recovery retryable, and preserve offline site-local recovery. Generalize warning copy to cover corrupt, future-version, and preview records. Reuse confirmation controls and `clearUserExtension`.

**Class sweep:** All three rejected global kinds and connected/disconnected popup states join the plan. Site-local recovery keeps its current target. No new scope or storage format is introduced.

🧪 **Red proof:** In the real popup/Home path, each rejected global state exposes recovery that calls global clear and never site clear. Cover failure remaining recoverable and a target remaining stable while connectivity changes. Retain ordinary site reset checks.

📏 **Size:** Net production +12…+30, tests +65…+110; total +77…+140; roughly 120–195 touched lines in Home and existing popup tests.

⚠️ **Trade-offs:** One additional recovery entry point, shared confirmation implementation. FP6 establishes local ordering only; do not describe this as a global transaction.

🚫 **Avoid:** Clearing both scopes, enabling edits against rejected records, or silently changing ordinary Reset's meaning. This removes ambiguity from confirmation instead of adding another destructive-action flag.

**Recommendation:** A, taste. Retargeting ordinary Reset is ruled out as surprising behavior.

🔗 **Dependencies:** Implement FP6 before verifying local recovery ordering. Coordinate Home/provider edits with FP1.

### FP3 — Keep draft validity and successful saving in their current owners

**Covers:** CR1-3 (S1/F1 → P1).

🚨 **Problem:** The guides can finish with no selected editor, and extension custom editing treats blank input as success. A previously valid editor can also hide a failed or unfinished replacement draft.

✅ **Default A:** Consumers decide whether their editor step can advance and whether setup is complete. Wizard presents disabled/busy controls. A custom draft can be submitted before any editor has been saved.

🔎 **Planning detail — invariant:** Completing guided editor setup requires a selected effective editor and no pending editor edit/save; a deliberate Skip remains abandonment, not successful editor configuration. This proves a saved selection, not that an external editor is installed.

**Implementation:**

1. Give Wizard optional `nextDisabled`, `finishDisabled`, and `busy` affordances. Busy prevents duplicate/back/forward completion while a save is pending. It has no editor types, validators, or persistence logic.
2. Extension Onboarding owns its custom draft. Its Continue validates the draft, awaits the existing `updateEditor`, and advances only on success. Remove the empty-template success branch. Card selection and Done use the saved effective editor and pending-write state. Explain failed saves and prevent duplicate Enter/button submissions. Wire the existing Wizard Skip affordance with `onSkip={() => window.close()}`, keeping editor selection optional through a clearly named action rather than successful completion.
3. Runtime WelcomeScreen derives validity from its existing options store and save results. Resume a later saved step at the editor step if the effective editor is no longer selected. Guard transition/completion handlers using the same predicates as the button state.
4. Runtime EditorPicker already owns inline editing and saving. Expose one optional `onPendingChange(boolean)` notification derived from that existing state; do not mirror its draft or validation in WelcomeScreen. While editing, make its existing Enter-save/Escape-cancel behavior discoverable. Track parent-started writes and disable editor inputs during a pending write. A small disabled affordance on EditorCardPicker is sufficient where needed.

**Pinned handoff details:** Runtime inline blank draft retains its existing Cancel behavior; extension custom Continue on blank reports an error. Do not unify these contracts. Picker pending is editing-or-saving and clears on cleanup; Wizard busy means in-flight persistence only and blocks Back/Skip too. Runtime Skip still awaits successful dismissal persistence, whereas extension Skip closes. Account for existing shortcut/progress saves before completion; fixtures update effective state after successful saves. Rebuild shared UI output before testing dist-consuming runtime/extension code.

**Class sweep:** No-selection advancement, blank custom input, Enter submission, old valid editor plus unfinished replacement, failed/deferred writes, resumed final step, Finish/Done, and intentional Skip. Inherited selected editors satisfy the saved-selection requirement; no default is silently promoted to a user choice.

🧪 **Red proof:** First-ever custom editor can be saved with Continue; invalid drafts, failed/deferred writes, and absent selection cannot claim completion. An old selection cannot bypass a pending replacement. Update the existing successful onboarding E2E to select an editor, while retaining a separate Skip assertion. Extend existing picker/Wizard/persistence tests and add only the missing extension onboarding coverage.

📏 **Size:** Net production +65…+115, tests +150…+260; total +215…+375; roughly 300–490 touched lines. Tests cover the different existing draft owners; they should share fixtures rather than duplicate all scenarios for every button.

⚠️ **Trade-offs:** Small presentation props and one pending-edit notification. Runtime Skip remains; extension onboarding exposes the existing Wizard Skip affordance. Closing a browser tab is abandonment and cannot be prohibited by this contract.

🚫 **Avoid:** Requiring a saved editor before enabling the button that saves the first custom editor, a second validity store, a generic form framework, or a shared onboarding rewrite.

**Recommendation:** A, taste. Moving all drafts into a new shared flow is deferred; existing owners already have the necessary facts.

🔗 **Dependencies:** Picker/Wizard affordances first, then their two consumers. Serialize shared UI edits. Coordinate extension first-use copy with FP1.

### FP4 — Publish one coherent native module graph per format

**Covers:** CR1-4 (S1/F2 → P1).

🚨 **Problem:** Native consumers cannot load the advertised entries, while webpack and source-level tests mask the emitted graph's incompatibility.

✅ **Default A:** Reuse the existing webpack dependency to generate native ESM/CJS artifacts alongside the existing browser graph. Test actual installed package loading and declarations.

🔎 **Planning detail — invariant:** Each advertised native module format loads the correct public exports and declarations; root/subpath imports within that format share one configuration implementation. The server entry validates setup but remains inert.

**Implementation:**

1. Keep Babel browser output, CSS, and TypeScript declaration generation. Add one small native-build script consuming emitted JavaScript. Avoid import-specifier edits throughout the source tree or a new bundler dependency.
2. Runtime emits `index.server.mjs` and `.cjs`. Shared emits root `index.mjs/.cjs` and canonical `config.mjs/.cjs` for the existing strict-config subpath. Runtime's server entry imports `@locator/shared/strict-config`; leave that dependency external to avoid embedding another config instance.
3. Preserve native config identity within each format. `config.ts` owns a WeakMap for compiled rewrites: parsing via shared root and rewriting via strict-config must use the same instance. Select the narrow canonical external: requests `./config` or `./config.js` from the shared dist directory map to `./config.mjs` or `.cjs`, including imports in configStorage. Config itself is bundled once per format. Do not use independent embedded root/subpath config copies, shared chunks, or a manually maintained export list.
4. Keep the existing outer runtime condition order and browser/default behavior. Nest `import`/`require` and their matching `types` under native conditions. Remove top-level export-map types entries that would override the conditional declarations, while retaining legacy package-level types/main and the runtime deep-export wildcard. Shared root/subpath use browser/import/require/default branches as pinned in the handoff.
5. Generate small `.d.mts` facades using explicit `.js` declaration specifiers over the existing `.d.ts` graph. Runtime's facade must use `export { setup as default } from "./index.server.js"`, not re-export its CJS-context default, which the planning probe found non-callable. Keep CommonJS declarations in the existing package context. Validate NodeNext with `skipLibCheck: false`; installed declaration compatibility remains a proof obligation. Preserve named and default runtime exports.
6. Keep locatorjs's CJS forwarding shape. Add an ESM forwarding entry and declaration facade so `import setup from "locatorjs"` receives the callable runtime default instead of a CommonJS namespace. Include both in the package file allowlist.
7. Integrate native generation after normal builds and before packing. Root dev first builds packages before its existing parallel command; explicitly accept this initial startup cost. Runtime adds dev:native; shared splits dev:ts/dev:native and reuses the repository's concurrently version. The generator watches emitted-JS inputs, not its own native output. Remove inactive commented CJS script alternatives. Plan changes to dev scripts without starting a dev server during this task.

**Class sweep:** Runtime import/require, locatorjs import/require, shared root and strict-config, named/default exports, native declarations, browser resolution, and build/watch/prepack consistency all belong to this one package contract.

🧪 **Red proof:** Extend the existing installed-tarball consumer to execute native imports/requires, call valid/invalid server setup, and assert defaults and named exports. In each format, parse a rewrite via root and execute through strict-config and vice versa. Compile `.mts` and `.cts` consumers in NodeNext with library checking. Retain browser webpack coverage, including strict-config.

**Environment claims:** Preserve current worker/deno conditions without silently removing support. Node `--conditions` probes can smoke loader behavior but are not Worker or Deno runtime certification; Node's built-in node condition remains active. Actual additional-runtime certification is outside this fix. ESM and CJS have separate native module instances; passing opaque parsed objects between simultaneous import/require graphs is not a new interoperability promise. Normal setup takes raw inputs.

📏 **Size:** Net production/build/manifest +140…+230, verification +100…+170; total +240…+400; approximately 8–12 authored files and 300–500 touched lines. Generated artifacts excluded.

⚠️ **Trade-offs:** Native build configuration is concentrated in one generator. Preserve browser tree shaking, CSS behavior, server validation, declaration brands, and public compatibility. A simpler generator that passes all these checks is preferred over an extensible build framework.

🚫 **Avoid:** Only adding `type: module`, duplicating config state across native subpaths, testing through another webpack consumer instead of native Node, or rewriting all source/declaration trees by hand.

**Recommendation:** A, taste. A full source-graph ESM/CJS migration is ruled out as unnecessary churn.

🔗 **Dependencies:** Native shared output before runtime's installed-consumer checks. Reuse the existing package-contract installation; do not create a parallel harness.

### FP5 — Carry source-path meaning instead of guessing it later

**Covers:** CR1-5 (S1/F2 → P1).

🚨 **Problem:** A successfully resolved file outside the project root is later treated as project-relative, producing a nonexistent editor/copied/prompt path.

✅ **Default A:** Add optional `pathKind: "absolute" | "project-relative"` to existing source/link shapes, set it where the source format establishes that meaning, and preserve it through the existing conversions.

🔎 **Planning detail — invariant:** Once a producer establishes a filesystem path as absolute, every consumer retains that meaning. Explicitly relative sources join to the configured root. Untagged legacy inputs keep their existing interpretation.

**Implementation:**

1. Add one shared SourcePathKind type. Extend shared Source, runtime LinkProps, and UI TreeSourceRef. Reuse shared Source for the runtime's duplicate shape where possible, retaining its projectPath extension.
2. Extend the single `resolveSourcePath` interface with optional pathKind. A known absolute sibling stays unchanged with an empty template project root; a known relative path joins before the old inside-root heuristic can misclassify it. Preserve marker, Windows, and untagged behavior.
3. Preserve file-URL provenance before stripping schemes in source-map and stack parsing, including React server stack wrappers. Carry it through synchronous debug-info, asynchronous debug-stack, and renderer cleaning paths. Do not call every slash-prefixed source-map URL a filesystem path.
4. Change the narrow Next/Turbopack root-resolution return values from bare strings to path-plus-kind when their file-map evidence establishes a filesystem root. Update their existing assignments, with no new resolution strategies or guessed roots. Mark known Babel/JSX project-relative inputs at their current reading seam.
5. Carry the field through getFiberLabel, reverse React tree conversion, treeViewModel source/link conversions and parent rows. Caches already hold complete objects. BuildLink, copy-path, and buildPrompt pass the tag to the existing resolver, rather than adding their own exceptions.

**Class sweep:** File maps, file stacks, Next/Turbopack root resolution, synchronous and asynchronous React paths, source/link/tree reconstructions, and all three final action consumers. Unknown third-party source metadata remains untagged. This is not a migration of every location into a new value-object system.

🧪 **Red proof:** Use a real mapped sibling file fixture and production source→label/link→editor/copy/prompt conversion. Add a file-stack case through synchronous source lookup and a Next/Turbopack root case through tree/parents conversion. Keep compact table coverage for legacy `/src`, explicit relative, Windows, inside-root, and unresolved markers. Replace the current incorrect tagged sibling-path expectation while retaining a separate legacy untagged compatibility assertion.

📏 **Size:** Net production +55…+100, verification +100…+180; total +155…+280; approximately 14–20 authored files and 230–390 touched lines. Most production edits carry one fact through existing object construction.

⚠️ **Trade-offs:** New authoritative producers must set the optional fact; legacy untagged paths remain ambiguous. Editor-only configured path rewrites remain editor-only. Preserve root precedence, source fallback order, row identity, and column conventions.

🚫 **Avoid:** Treating every slash as absolute, filesystem-existence guesses in the browser, independent consumer heuristics, or a broad source-location rewrite.

**Recommendation:** A, taste. A mandatory new path object everywhere is not needed for the demonstrated paths.

🔗 **Dependencies:** Shared path kind and resolver, then producer propagation, then consumer checks. Run affected runtime/UI checks after the complete chain is in place.

### FP6 — Put all local storage writes on the existing ordering owner

**Covers:** CR1-6 (S1/F3 → P2).

🚨 **Problem:** Clear can run before an accepted write or migration finishes, allowing settings to reappear after reset.

✅ **Default A:** Reuse the existing promise tail for initialization migration, patch read/modify/persist, and raw clear. Recovery must not require a successfully decoded snapshot.

🔎 **Planning detail — scoped invariant:** Within one loaded extension storage context, clear is ordered after accepted earlier writes/migration and before accepted later patches. Failure of one operation does not prevent subsequent recovery.

**Implementation, refined 2026-09-07:** Remove readinessPromise rather than coordinating a cached promise with the queue. Extract private enqueueStorageOperation and readAndMigrateRaw helpers. Ensure/read enqueue once; read directly returns ensure rather than wrapping it in another queue or rereading. Patch enqueues one raw-read/migrate→snapshot/apply→persist operation after input validation. Clear enqueues removal of the existing exact STORAGE_KEYS without reading or parsing. No queued callback may call a public queued function. The tail recovers after rejection, but each operation keeps its existing rejection/WriteResult behavior. This handles failed migration→already-queued clear→already-queued patch without stale readiness failures or deadlock. Rechecking the bounded legacy-key set on reads is the explicit cost; absent keys do not cause extra normal writes. No retries or new state flags.

**Class sweep:** Initial migration set/cleanup, patch persistence, and clear are all writes to this local contract. Migration is not assumed to have completed merely because a provider mounted. Separate reload-marker keys are unrelated.

🧪 **Red proof:** Controlled storage promises prove patch→clear, clear→patch, migration→clear, failed migration→clear→patch with all already queued, recovery after write/clear rejection, clear of rejected formats, and first patch initialization without deadlock. Mocks update stored values only after delayed I/O resolves. Assert origin grants survive config reset. Extend the existing storage/migration tests instead of a second queue-specific test suite.

📏 **Size, revised 2026-09-07:** Net production −10…+20, tests +80…+145; total +70…+165; roughly 145–245 touched lines.

⚠️ **Proposed residual, not yet accepted:** Popup, onboarding, background, and content scripts load different module instances. This plan does not serialize concurrent operations across those contexts or promise crash-safe transactions. If extension-wide ordering is required for this release, replace the local-write design with one background writer for initialization/patch/clear and re-plan its caller/message changes. Do not mark the broader guarantee closed by these local tests.

🚫 **Avoid:** Another revision counter, per-caller scheduling, a clear implementation that depends on valid parsing, retries, durable queues, or disguising a local tail as global ownership.

**Recommendation:** A with the stated limited guarantee, taste. A background writer is a real structural alternative if that residual is rejected, not an automatically included subsystem.

🔗 **Dependencies:** Before FP2's local reset verification. FP1's per-origin keys remain separate and do not require this config queue.

### FP7 — Establish root observation at successful setup

**Covers:** CR1-7 (S1/F3 → P2).

🚨 **Problem:** A closed root created after disabled setup but before activation cannot be recovered by later scanning.

✅ **Default A:** Call the existing tracker after successful configuration commit, regardless of visual enabled state. Remove the disabled predicate and now-unused options-snapshot import at that site.

🔎 **Planning detail — invariant:** Successful setup observes future closed-root creation; disabled still prevents visual runtime activation, and invalid setup has no tracking side effects.

**Implementation:** Change runtime index.ts only for the production correction. Preserve activation-time idempotent installation because other startup paths use it. Do not change the shared registry or the already-early extension hook.

**Class sweep:** Library setup/activation timing is the affected path; extension document-start tracking already covers its path. Roots created before setup remain a stated limitation.

🧪 **Proof:** In dedicated index.shadowRoots.test.ts with fresh jsdom, create a closed negative-control root before any setup, call disabled setup, create another closed root before timers or registry getters, then enable. Only afterward inspect: the pre-setup root remains undiscoverable, the post-setup root is registered, and both native shadowRoot properties are null. Mock only initRuntime. Existing registry reset preserves the global patch, and getters install it, so neither may make this test pass accidentally. The negative control detects prepatched test environments. Retain invalid-setup and disabled-no-visual-runtime assertions.

📏 **Size:** Net production −2…0, tests +25…+50; total +23…+50; roughly 32–65 touched lines.

⚠️ **Trade-off:** Successful disabled setup performs the existing attachShadow patch and one document scan. This cost is explicit; there is no new tracking mechanism.

🚫 **Avoid:** A recovery system for already inaccessible closed roots, enabling the visual UI to observe roots, or module-import side effects.

**Recommendation:** A, taste because the disabled-startup scan is a product/lifecycle decision. Deferral with a documented limitation is acceptable if that startup behavior is unwanted.

### Implementation order and completion checks

1. FP1's privacy contract is resolved: automatic HTTP(S) localhost trust plus approval of other exact origins, accepting disclosure to their scripts. Obtain implementation approval for the round and its remaining proposed residuals; the privacy discussion alone does not start implementation.
2. Land the independently reviewable native package correction (FP4) and source meaning correction (FP5). Keep their commits separate; build-file changes and source changes are distinct, even where packages overlap.
3. Implement local storage ordering (FP6), then reset targeting/recovery (FP2). Verify the captured target and the queue through real storage-facing tests together.
4. Implement the selected privacy design (FP1), coordinating its popup/provider changes with FP2. Verify initial denial and all private egress paths before enabling the new approval flow in the release.
5. Implement onboarding state correction (FP3) after its shared UI affordances, aligning first-use copy with the selected privacy design. Implement FP7 independently using a fresh-context regression.
6. Run the final gates and a focused adversarial verification of these fixed guarantees and neighboring behavior. New unrelated findings enter triage; they do not silently expand this round.

**Verification budget:**

- For every reported P0/P1 cluster, demonstrate the production-interface regression failing before the fix and passing after. Do not weaken an existing contract to make its test pass.
- Use Node selected from `.nvmrc`. Run the affected package unit/type/lint checks during implementation, then root `pnpm check` and installed `pnpm package-contract` on the completed candidate.
- Run the relevant grouped Playwright coverage using a free isolated port block from `scripts/dev-ports.sh`: settings/bindings for onboarding and actions, adapters/tree/next for source propagation, embedding for root/frame changes. Playwright owns its servers; do not start `pnpm dev` manually.
- Build Chrome and Firefox extension artifacts. Run the headed extension privacy integration using its real fixture; it is not covered by `pnpm e2e`/CI. Perform the Firefox origin-identity spot-check or explicitly leave that release validation outstanding.
- If a new spec is added, assign its e2e group. Preserve generated-output rules and existing dependency-version conventions.
- Fixers report removed/replaced logic and actual production/test deltas. A fresh verifier checks restored behavior, nearby regressions, scope, and whether the implementation added scattered guards instead of enforcing the chosen rule.
- Use one commit per separable plan once implementation is authorized and gates pass. Do not commit, push, publish, or edit external PRs during planning. Preserve the user's existing staged records.

**Stop condition:** The selected guarantees pass their production-interface checks, required gates are green or an unchanged baseline failure is explicitly recorded, and the user has accepted any retained limitation. A blind later review is evidence about closure, not permission to add support for every new edge case. This round does not promise a zero-findings codebase.

### Decisions and proposed residuals

- All plans are proposals. No implementation approval has been received.
- FP1-A with automatic HTTP(S) localhost trust was selected on 2026-09-07. Other exact origins still require explicit approval; a private action broker is not selected. See FP1's policy amendment for the user's reply and the disclosed trade-off.
- FP6's cross-context race remains a proposed accepted limitation under its local-fix option. It is not marked accepted-risk or verified-closed.
- FP4 preserves existing export conditions but does not add actual Worker/Deno certification or cross-format opaque-object interoperability. FP5 retains untagged legacy ambiguity. FP7 cannot discover roots predating tracking. These are stated limits, not hidden guarantees.
- ROUND-1's action-removal default and its estimates are superseded. For this sheet, `FP1-B` requests a broker design revision; other objections revise the named plan. A subsequent explicit `go` would select the ROUND-2 recommended defaults and their stated residuals, not ROUND-1. The current `/plan` request is not such approval.

### Baseline verification — 2026-09-06

Command run from this workspace:

```sh
source /Users/michaelmusil/.nvm/nvm.sh && nvm use --silent && pnpm check
```

Result: failed only at `@locator/web#build` because the local darwin-arm64 `sharp` optional binary is unavailable. Formatting, dependency consistency, suppression/script checks, Knip and duplication checks completed; Turbo reported 40 successful tasks of 41, with 27 cached. This reproduces the previously recorded baseline failure. A separate diagnostic confirmed both shell `node` and `pnpm exec node` resolve to Node v22.23.2 after selecting `.nvmrc`.

No implementation, post-fix verification, extension browser integration, or fresh package-contract run was performed in this planning turn. The missing optional binary should be repaired as a local environment task before the final implementation gate, without changing application behavior or dependency policy to hide it.
